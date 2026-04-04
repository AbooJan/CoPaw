import { Tooltip } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useAgentAvatars } from "../../hooks/useAgentAvatars";
import { useAgentStore } from "../../stores/agentStore";
import { agentsApi } from "../../api/modules/agents";
import { useTranslation } from "react-i18next";
import { normalizeAgentAvatar } from "../../utils/agentAvatar";
import { getAgentDisplayName } from "../../utils/agentDisplayName";
import { useAppMessage } from "../../hooks/useAppMessage";
import styles from "./index.module.less";

interface AgentSelectorProps {
  collapsed?: boolean;
}

export default function AgentSelector({
  collapsed = false,
}: AgentSelectorProps) {
  const { t } = useTranslation();
  const { avatars } = useAgentAvatars();
  const { selectedAgent, agents, setSelectedAgent, setAgents } =
    useAgentStore();
  const { message } = useAppMessage();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await agentsApi.listAgents();
      // Sort agents: enabled first, disabled last
      const sortedAgents = [...data.agents].sort((a, b) => {
        if (a.enabled === b.enabled) return 0;
        return a.enabled ? -1 : 1;
      });
      setAgents(sortedAgents);
    } catch (error) {
      console.error("Failed to load agents:", error);
      message.error(t("agent.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Auto-switch to default if the selected agent was deleted or disabled
  useEffect(() => {
    if (!agents?.length || selectedAgent === "default") return;

    const currentAgent = agents.find((a) => a.id === selectedAgent);

    if (!currentAgent) {
      // Agent was deleted — no longer in the list
      setSelectedAgent("default");
      message.warning(t("agent.currentAgentDeleted"));
    } else if (!currentAgent.enabled) {
      // Agent exists but was disabled
      setSelectedAgent("default");
      message.warning(t("agent.currentAgentDisabled"));
    }
  }, [agents, selectedAgent, setSelectedAgent, t]);

  const currentAgentInfo = agents?.find((a) => a.id === selectedAgent);
  const displayAgent = useMemo(
    () =>
      currentAgentInfo || {
        id: selectedAgent,
        name: selectedAgent,
        description: "",
        workspace_dir: "",
        enabled: true,
      },
    [currentAgentInfo, selectedAgent],
  );

  if (collapsed) {
    return (
      <Tooltip
        title={
          `${getAgentDisplayName(displayAgent, t)} (${displayAgent.id})`
        }
        placement="right"
        overlayInnerStyle={{ background: "rgba(0,0,0,0.75)", color: "#fff" }}
      >
        <div className={styles.agentSelectorCollapsed}>
          <span className={styles.selectorAvatar}>
            {normalizeAgentAvatar(avatars[displayAgent.id])}
          </span>
        </div>
      </Tooltip>
    );
  }

  return (
    <div className={styles.agentSelectorWrapper}>
      <div className={styles.agentSelectorLabel}>
        <span>{t("agent.currentWorkspace")}</span>
      </div>
      <div
        className={`${styles.agentInfoCard} ${loading ? styles.agentInfoLoading : ""}`}
        aria-label={t("agent.currentWorkspace")}
      >
        <div className={styles.agentInfoAvatar}>
          {normalizeAgentAvatar(avatars[displayAgent.id])}
        </div>
        <div className={styles.agentInfoIdRow}>
          <span className={styles.agentInfoIdLabel}>{t("agent.id")}</span>
          <span className={styles.agentInfoId}>{displayAgent.id}</span>
        </div>
        <div className={styles.agentInfoName}>
          {getAgentDisplayName(displayAgent, t)}
        </div>
        <div className={styles.agentInfoDescription}>
          {displayAgent.description?.trim() || "-"}
        </div>
      </div>
    </div>
  );
}
