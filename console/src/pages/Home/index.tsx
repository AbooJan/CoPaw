import { useEffect, useState } from "react";
import { Button, Card, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlayCircleOutlined, RobotOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { agentsApi } from "../../api/modules/agents";
import type { AgentSummary } from "../../api/types/agents";
import { useAppMessage } from "../../hooks/useAppMessage";
import { getAgentDisplayName } from "../../utils/agentDisplayName";
import styles from "./index.module.less";

const { Title, Text } = Typography;

export default function HomePage() {
  const { t } = useTranslation();
  const { message } = useAppMessage();
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<AgentSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadAgents = async () => {
      setLoading(true);
      try {
        const data = await agentsApi.listAgents();
        if (!cancelled) {
          setAgents(data.agents);
        }
      } catch (error) {
        console.error("Failed to load agents:", error);
        message.error(t("agent.loadFailed"));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAgents();
    return () => {
      cancelled = true;
    };
  }, [message, t]);

  const handleStart = (agent: AgentSummary) => {
    if (!agent.enabled) {
      message.warning(t("agent.cannotSwitchToDisabled"));
      return;
    }

    const basePath = window.location.pathname.startsWith("/console")
      ? "/console"
      : "";
    const targetUrl = `${basePath}/chat?agentId=${encodeURIComponent(
      agent.id,
    )}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const columns: ColumnsType<AgentSummary> = [
    {
      title: t("agent.name"),
      dataIndex: "name",
      key: "name",
      render: (_: string, record: AgentSummary) => (
        <Space>
          <RobotOutlined />
          <span>{getAgentDisplayName(record, t)}</span>
          {!record.enabled && <Tag color="error">{t("agent.disabled")}</Tag>}
        </Space>
      ),
    },
    {
      title: t("agent.id"),
      dataIndex: "id",
      key: "id",
      width: 220,
    },
    {
      title: t("agent.description"),
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (value?: string) => value || "-",
    },
    {
      title: t("common.actions"),
      key: "actions",
      width: 120,
      render: (_: unknown, record: AgentSummary) => (
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => handleStart(record)}
          disabled={!record.enabled}
        >
          {t("agent.start")}
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Title level={3} className={styles.title}>
            {t("agent.agents")}
          </Title>
          <Text type="secondary">
            {t("common.total")}: {agents.length}
          </Text>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={agents}
          columns={columns}
          pagination={false}
        />
      </Card>
    </div>
  );
}
