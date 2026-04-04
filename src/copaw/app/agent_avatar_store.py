# -*- coding: utf-8 -*-
"""Local storage for agent emoji avatars.

This store is intentionally independent from the main agent models so avatar
metadata can evolve without changing ``AgentProfileConfig`` or ``AgentSummary``.
"""
from __future__ import annotations

import json

from pydantic import BaseModel, Field, field_validator

from ..constant import WORKING_DIR

_AVATAR_STORE_FILE = WORKING_DIR / "agent_avatars.json"
_DEFAULT_AGENT_AVATAR = "🤖"


class AgentAvatarStore(BaseModel):
    """Persistent mapping of agent id -> emoji avatar."""

    avatars: dict[str, str] = Field(default_factory=dict)


class AgentAvatarPayload(BaseModel):
    """Request payload for saving one agent avatar."""

    emoji: str

    @field_validator("emoji")
    @classmethod
    def validate_emoji(cls, value: str) -> str:
        """Keep the stored avatar compact and non-empty."""
        emoji = value.strip()
        if not emoji:
            raise ValueError("Emoji avatar cannot be empty")
        if len(emoji) > 16:
            raise ValueError("Emoji avatar is too long")
        return emoji


def load_agent_avatar_store() -> AgentAvatarStore:
    """Load the local avatar store from disk."""
    if not _AVATAR_STORE_FILE.is_file():
        return AgentAvatarStore()

    try:
        payload = json.loads(_AVATAR_STORE_FILE.read_text("utf-8"))
    except (json.JSONDecodeError, OSError):
        return AgentAvatarStore()

    try:
        return AgentAvatarStore.model_validate(payload)
    except Exception:  # noqa: BLE001
        return AgentAvatarStore()


def save_agent_avatar_store(store: AgentAvatarStore) -> None:
    """Persist the avatar store to disk."""
    _AVATAR_STORE_FILE.parent.mkdir(parents=True, exist_ok=True)
    _AVATAR_STORE_FILE.write_text(
        json.dumps(store.model_dump(), indent=2, ensure_ascii=False),
        "utf-8",
    )


def list_agent_avatars(valid_agent_ids: set[str] | None = None) -> dict[str, str]:
    """Return stored avatars, optionally filtered to known agents."""
    store = load_agent_avatar_store()
    avatars = dict(store.avatars)

    if valid_agent_ids is None:
        return avatars

    filtered = {
        agent_id: emoji
        for agent_id, emoji in avatars.items()
        if agent_id in valid_agent_ids
    }

    if filtered != avatars:
        save_agent_avatar_store(AgentAvatarStore(avatars=filtered))

    return filtered


def save_agent_avatar(agent_id: str, emoji: str) -> str:
    """Persist one agent avatar and return the normalized emoji."""
    payload = AgentAvatarPayload(emoji=emoji)
    store = load_agent_avatar_store()
    store.avatars[agent_id] = payload.emoji
    save_agent_avatar_store(store)
    return payload.emoji


def delete_agent_avatar(agent_id: str) -> None:
    """Remove one agent avatar if it exists."""
    store = load_agent_avatar_store()
    if agent_id not in store.avatars:
        return

    del store.avatars[agent_id]
    save_agent_avatar_store(store)
