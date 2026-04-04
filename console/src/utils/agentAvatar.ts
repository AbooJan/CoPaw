export const DEFAULT_AGENT_AVATAR = "🤖";

export function normalizeAgentAvatar(avatar?: string | null): string {
  const trimmed = avatar?.trim();
  return trimmed || DEFAULT_AGENT_AVATAR;
}

export function shouldPersistAgentAvatar(avatar?: string | null): boolean {
  const trimmed = avatar?.trim();
  return !!trimmed && trimmed !== DEFAULT_AGENT_AVATAR;
}
