import { request } from "../request";
import type {
  AgentAvatarMapResponse,
  AgentAvatarResponse,
} from "../types/agentAvatar";

export const agentAvatarApi = {
  listAgentAvatars: () =>
    request<AgentAvatarMapResponse>("/agents/avatars"),

  saveAgentAvatar: (agentId: string, emoji: string) =>
    request<AgentAvatarResponse>(`/agents/${agentId}/avatar`, {
      method: "PUT",
      body: JSON.stringify({ emoji }),
    }),

  deleteAgentAvatar: (agentId: string) =>
    request<{ success: boolean; agent_id: string }>(
      `/agents/${agentId}/avatar`,
      {
        method: "DELETE",
      },
    ),
};
