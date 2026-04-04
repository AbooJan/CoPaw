import { useCallback, useEffect, useState } from "react";
import { agentAvatarApi } from "../api/modules/agentAvatar";

const AGENT_AVATARS_UPDATED_EVENT = "copaw-agent-avatars-updated";

export function notifyAgentAvatarsUpdated() {
  window.dispatchEvent(new Event(AGENT_AVATARS_UPDATED_EVENT));
}

export function useAgentAvatars() {
  const [avatars, setAvatars] = useState<Record<string, string>>({});

  const loadAvatars = useCallback(async () => {
    try {
      const data = await agentAvatarApi.listAgentAvatars();
      setAvatars(data.avatars || {});
      return data.avatars || {};
    } catch (error) {
      console.error("Failed to load agent avatars:", error);
      return {};
    }
  }, []);

  useEffect(() => {
    void loadAvatars();
  }, [loadAvatars]);

  useEffect(() => {
    const handleUpdated = () => {
      void loadAvatars();
    };

    window.addEventListener(AGENT_AVATARS_UPDATED_EVENT, handleUpdated);
    return () => {
      window.removeEventListener(
        AGENT_AVATARS_UPDATED_EVENT,
        handleUpdated,
      );
    };
  }, [loadAvatars]);

  return {
    avatars,
    setAvatars,
    loadAvatars,
  };
}
