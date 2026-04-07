export interface AgentChatLaunchPayload {
  agentId: string;
  agentName: string;
  agentAvatar: string;
}

export interface InitialAgentLaunchPayload {
  agentId: string | null;
  agentName: string | null;
  agentAvatar: string | null;
}

export function buildAgentChatLaunchUrl({
  agentId,
  agentName,
  agentAvatar,
}: AgentChatLaunchPayload): string {
  const basePath = window.location.pathname.startsWith("/console")
    ? "/console"
    : "";
  const params = new URLSearchParams({
    agentId,
    agentName,
    agentAvatar,
  });

  return `${basePath}/chat?${params.toString()}`;
}

export function getInitialAgentLaunchPayload(
  searchParams: URLSearchParams,
): InitialAgentLaunchPayload {
  return {
    agentId: searchParams.get("agentId"),
    agentName: searchParams.get("agentName"),
    agentAvatar: searchParams.get("agentAvatar"),
  };
}
