import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Empty,
  Form,
  Popconfirm,
  Spin,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useTranslation } from "react-i18next";
import { agentsApi } from "../../api/modules/agents";
import { skillApi } from "../../api/modules/skill";
import type { AgentSummary } from "../../api/types/agents";
import {
  notifyAgentAvatarsUpdated,
  useAgentAvatars,
} from "../../hooks/useAgentAvatars";
import { useAppMessage } from "../../hooks/useAppMessage";
import {
  DEFAULT_AGENT_AVATAR,
  normalizeAgentAvatar,
  shouldPersistAgentAvatar,
} from "../../utils/agentAvatar";
import { buildAgentChatLaunchUrl } from "../../utils/agentLaunch";
import { getAgentDisplayName } from "../../utils/agentDisplayName";
import {
  resetDocumentFavicon,
  setDocumentBaseTitle,
} from "../../utils/documentIdentity";
import { useAgentStore } from "../../stores/agentStore";
import { AgentModal } from "../Settings/Agents/components";
import { useAgents } from "../Settings/Agents/useAgents";
import { agentAvatarApi } from "../../api/modules/agentAvatar";
import { reorderAgents } from "../Settings/Agents/reorder";
import SortableAgentCard from "./SortableAgentCard";
import styles from "./index.module.less";

const { Title, Text, Paragraph } = Typography;

export default function HomePage() {
  const { t } = useTranslation();
  const { message } = useAppMessage();
  const { agents, loading, deleteAgent, loadAgents, setAgents } = useAgents();
  const { avatars, loadAvatars } = useAgentAvatars();
  const { selectedAgent, setSelectedAgent } = useAgentStore();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentSummary | null>(null);
  const [draftAvatar, setDraftAvatar] = useState(DEFAULT_AGENT_AVATAR);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [reordering, setReordering] = useState(false);
  const installedSkillsRef = useRef<string[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  useEffect(() => {
    setDocumentBaseTitle(t("home.pageTitle"));
    resetDocumentFavicon();
  }, [t]);

  const sortableIds = useMemo(() => agents.map((agent) => agent.id), [agents]);

  const handleCreate = () => {
    setEditingAgent(null);
    form.resetFields();
    form.setFieldsValue({
      workspace_dir: "",
    });
    setSelectedSkills([]);
    setDraftAvatar(DEFAULT_AGENT_AVATAR);
    installedSkillsRef.current = [];
    setModalVisible(true);
  };

  const handleStart = (agent: AgentSummary) => {
    if (!agent.enabled) {
      message.warning(t("agent.cannotSwitchToDisabled"));
      return;
    }

    const targetUrl = buildAgentChatLaunchUrl({
      agentId: agent.id,
      agentName: getAgentDisplayName(agent, t),
      agentAvatar: normalizeAgentAvatar(avatars[agent.id]),
    });
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleEdit = async (agent: AgentSummary) => {
    if (agent.id === "default") {
      return;
    }

    try {
      const config = await agentsApi.getAgent(agent.id);
      setEditingAgent(agent);
      setDraftAvatar(normalizeAgentAvatar(avatars[agent.id]));
      form.setFieldsValue(config);
      setModalVisible(true);
    } catch (error) {
      console.error("Failed to load agent config:", error);
      message.error(t("agent.loadConfigFailed"));
    }
  };

  const handleDelete = async (agentId: string) => {
    try {
      await deleteAgent(agentId);

      if (selectedAgent === agentId) {
        setSelectedAgent("default");
        message.info(t("agent.switchedToDefault"));
      }
    } catch {
      message.error(t("agent.deleteFailed"));
    }
  };

  const handleInstalledSkillsLoaded = (skills: string[]) => {
    installedSkillsRef.current = skills;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || reordering) {
      return;
    }

    const previousAgents = agents;
    const nextAgents = reorderAgents(agents, String(active.id), String(over.id));
    if (nextAgents === previousAgents) {
      return;
    }

    setAgents(nextAgents);
    setReordering(true);

    try {
      await agentsApi.reorderAgents(nextAgents.map((agent) => agent.id));
      message.success(t("agent.reorderSuccess"));
    } catch (error) {
      console.error("Failed to reorder agents from home:", error);
      setAgents(previousAgents);
      message.error(t("agent.reorderFailed"));
    } finally {
      setReordering(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const workspaceRaw = values.workspace_dir;
      const workspace_dir =
        typeof workspaceRaw === "string"
          ? workspaceRaw.trim() || undefined
          : workspaceRaw;
      const payload = { ...values, workspace_dir };

      if (editingAgent) {
        const newSkills = selectedSkills.filter(
          (skill) => !installedSkillsRef.current.includes(skill),
        );

        for (const skill of newSkills) {
          await skillApi.downloadSkillPoolSkill({
            skill_name: skill,
            targets: [{ workspace_id: editingAgent.id }],
          });
        }

        await agentsApi.updateAgent(editingAgent.id, payload);
        if (shouldPersistAgentAvatar(draftAvatar)) {
          await agentAvatarApi.saveAgentAvatar(editingAgent.id, draftAvatar);
        } else {
          await agentAvatarApi.deleteAgentAvatar(editingAgent.id);
        }
        message.success(t("agent.updateSuccess"));
      } else {
        const result = await agentsApi.createAgent({
          ...payload,
          skill_names: selectedSkills,
        });
        if (shouldPersistAgentAvatar(draftAvatar)) {
          await agentAvatarApi.saveAgentAvatar(result.id, draftAvatar);
        }
        message.success(`${t("agent.createSuccess")} (ID: ${result.id})`);
      }

      setModalVisible(false);
      await Promise.all([loadAgents(), loadAvatars()]);
      notifyAgentAvatarsUpdated();
    } catch (error: any) {
      console.error("Failed to save agent:", error);
      message.error(error.message || t("agent.saveFailed"));
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageInner}>
        <div className={styles.hero}>
          <div>
            <Title level={2} className={styles.title}>
              {t("agent.agents")}
            </Title>
            <Paragraph className={styles.subtitle}>
              {t("agent.dragSortHint")}
            </Paragraph>
          </div>
          <Button
            type="default"
            icon={<SettingOutlined />}
            className={styles.settingsEntry}
            onClick={() => window.open("/settings", "_blank", "noopener,noreferrer")}
          >
            {t("settingsLanding.title")}
          </Button>
        </div>

        {loading && agents.length === 0 ? (
          <div className={styles.loadingState}>
            <Spin size="large" />
          </div>
        ) : agents.length === 0 ? (
          <div className={styles.emptyState}>
            <Empty description={`${t("agent.agents")} · 0`} />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
              <div className={styles.grid}>
                {agents.map((agent) => {
                  const isDefaultAgent = agent.id === "default";
                  const isDisabled = !agent.enabled;

                  return (
                    <SortableAgentCard
                      key={agent.id}
                      id={agent.id}
                      dragDisabled={reordering || loading}
                      className={`${styles.agentCard} ${
                        isDisabled ? styles.agentCardDisabled : ""
                      }`}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.avatarBadge}>
                          {normalizeAgentAvatar(avatars[agent.id])}
                        </div>
                        {isDisabled && (
                          <span className={styles.statusChip}>
                            {t("agent.disabled")}
                          </span>
                        )}
                      </div>

                      <div className={styles.metaBlock}>
                        <Text className={styles.metaLabel}>{t("agent.id")}</Text>
                        <Text className={styles.agentId}>{agent.id}</Text>
                      </div>

                      <div className={styles.contentBlock}>
                        <Title level={4} className={styles.agentName}>
                          {getAgentDisplayName(agent, t)}
                        </Title>
                        <Paragraph className={styles.agentDescription}>
                          {agent.description?.trim() || "-"}
                        </Paragraph>
                      </div>

                      <div className={styles.actions}>
                        <Button
                          type="primary"
                          block
                          icon={<PlayCircleOutlined />}
                          onClick={() => handleStart(agent)}
                          disabled={isDisabled}
                        >
                          {t("agent.start")}
                        </Button>

                        <div className={styles.actionRow}>
                          <Button
                            block
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(agent)}
                            disabled={isDefaultAgent}
                          >
                            {t("common.edit")}
                          </Button>

                          <Popconfirm
                            title={t("agent.deleteConfirm")}
                            description={t("agent.deleteConfirmDesc")}
                            onConfirm={() => handleDelete(agent.id)}
                            disabled={isDefaultAgent}
                            okText={t("common.confirm")}
                            cancelText={t("common.cancel")}
                          >
                            <Button
                              block
                              danger
                              icon={<DeleteOutlined />}
                              disabled={isDefaultAgent}
                            >
                              {t("common.delete")}
                            </Button>
                          </Popconfirm>
                        </div>
                      </div>
                    </SortableAgentCard>
                  );
                })}

                <button
                  type="button"
                  className={styles.addCard}
                  onClick={handleCreate}
                >
                  <span className={styles.addButton}>
                    <PlusOutlined />
                  </span>
                  <span className={styles.addTitle}>{t("agent.create")}</span>
                  <span className={styles.addHint}>{t("agent.createTitle")}</span>
                </button>
              </div>
            </SortableContext>
          </DndContext>
        )}

        <AgentModal
          open={modalVisible}
          editingAgent={editingAgent}
          form={form}
          avatar={draftAvatar}
          selectedSkills={selectedSkills}
          onAvatarChange={setDraftAvatar}
          onSelectedSkillsChange={setSelectedSkills}
          onInstalledSkillsLoaded={handleInstalledSkillsLoaded}
          onSave={handleSubmit}
          onCancel={() => setModalVisible(false)}
        />
      </div>
    </div>
  );
}
