# -*- coding: utf-8 -*-
"""Tests for local agent avatar storage and routing."""

from __future__ import annotations

import json
from types import SimpleNamespace

import pytest

from copaw.app import agent_avatar_store
from copaw.app.agent_avatar_store import AgentAvatarPayload
from copaw.app.routers import agents as agents_router
from copaw.config.config import AgentProfileRef, Config


def _build_config(profile_ids: list[str]) -> Config:
    config = Config()
    config.agents.profiles = {
        agent_id: AgentProfileRef(
            id=agent_id,
            workspace_dir=f"/tmp/{agent_id}",
        )
        for agent_id in profile_ids
    }
    return config


def test_list_agent_avatars_filters_unknown_agents(tmp_path, monkeypatch):
    """Stale avatar entries should be filtered out of the local store."""
    avatar_file = tmp_path / "agent_avatars.json"
    avatar_file.write_text(
        json.dumps(
            {
                "avatars": {
                    "alpha": "😀",
                    "ghost": "👻",
                },
            },
            ensure_ascii=False,
        ),
        "utf-8",
    )

    monkeypatch.setattr(
        agent_avatar_store,
        "_AVATAR_STORE_FILE",
        avatar_file,
    )

    avatars = agent_avatar_store.list_agent_avatars(valid_agent_ids={"alpha"})

    assert avatars == {"alpha": "😀"}
    saved = json.loads(avatar_file.read_text("utf-8"))
    assert saved == {"avatars": {"alpha": "😀"}}


@pytest.mark.asyncio
async def test_list_local_agent_avatars_uses_configured_agent_ids(monkeypatch):
    """Avatar listing should only include configured agents."""
    config = _build_config(["default", "alpha"])

    monkeypatch.setattr(agents_router, "load_config", lambda: config)
    monkeypatch.setattr(
        agents_router,
        "load_agent_avatars",
        lambda valid_agent_ids=None: {
            agent_id: "😀"
            for agent_id in sorted(valid_agent_ids or set())
            if agent_id == "alpha"
        },
    )

    response = await agents_router.list_local_agent_avatars()

    assert response.avatars == {"alpha": "😀"}


@pytest.mark.asyncio
async def test_put_agent_avatar_persists_local_avatar(monkeypatch):
    """Saving an avatar should delegate to the local avatar store."""
    config = _build_config(["default", "alpha"])
    saved: dict[str, str] = {}

    monkeypatch.setattr(agents_router, "load_config", lambda: config)

    def _save(agent_id: str, emoji: str) -> str:
        saved[agent_id] = emoji
        return emoji

    monkeypatch.setattr(agents_router, "save_agent_avatar", _save)

    response = await agents_router.put_agent_avatar(
        "alpha",
        AgentAvatarPayload(emoji="🦊"),
    )

    assert response == {"agent_id": "alpha", "emoji": "🦊"}
    assert saved == {"alpha": "🦊"}


@pytest.mark.asyncio
async def test_delete_agent_cleans_up_local_avatar(monkeypatch):
    """Deleting an agent should also remove its local avatar."""
    config = _build_config(["default", "alpha", "beta"])
    deleted_agent_ids: list[str] = []

    class DummyManager:
        async def stop_agent(self, agent_id: str) -> None:
            assert agent_id == "beta"

    monkeypatch.setattr(agents_router, "load_config", lambda: config)
    monkeypatch.setattr(agents_router, "save_config", lambda updated: None)
    monkeypatch.setattr(
        agents_router,
        "_get_multi_agent_manager",
        lambda request: DummyManager(),
    )
    monkeypatch.setattr(
        agents_router,
        "delete_agent_avatar",
        lambda agent_id: deleted_agent_ids.append(agent_id),
    )

    await agents_router.delete_agent(
        "beta",
        request=SimpleNamespace(app=SimpleNamespace(state=SimpleNamespace())),
    )

    assert "beta" not in config.agents.profiles
    assert deleted_agent_ids == ["beta"]
