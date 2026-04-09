import { Card, Typography } from "antd";
import {
  SettingOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  AudioOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import {
  resetDocumentFavicon,
  setDocumentBaseTitle,
} from "@/utils/documentIdentity";
import styles from "./index.module.less";

const { Paragraph } = Typography;

type SettingsEntry = {
  key: string;
  title: string;
  description: string;
  path: string;
  icon: ReactNode;
};

export default function SettingsLandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    setDocumentBaseTitle(`CoPaw · ${t("settingsLanding.title")}`);
    resetDocumentFavicon();
  }, [t]);

  const entries = useMemo<SettingsEntry[]>(
    () => [
      {
        key: "models",
        title: t("nav.models"),
        description: t("settingsLanding.modelsDescription"),
        path: "/settings/models",
        icon: <SettingOutlined />,
      },
      {
        key: "skill-pool",
        title: t("nav.skillPool"),
        description: t("settingsLanding.skillPoolDescription"),
        path: "/settings/skill-pool",
        icon: <AppstoreOutlined />,
      },
      {
        key: "environments",
        title: t("nav.environments"),
        description: t("settingsLanding.environmentsDescription"),
        path: "/settings/environments",
        icon: <DatabaseOutlined />,
      },
      {
        key: "security",
        title: t("nav.security"),
        description: t("settingsLanding.securityDescription"),
        path: "/settings/security",
        icon: <SafetyCertificateOutlined />,
      },
      {
        key: "token-usage",
        title: t("nav.tokenUsage"),
        description: t("settingsLanding.tokenUsageDescription"),
        path: "/settings/token-usage",
        icon: <BarChartOutlined />,
      },
      {
        key: "voice-transcription",
        title: t("nav.voiceTranscription"),
        description: t("settingsLanding.voiceTranscriptionDescription"),
        path: "/settings/voice-transcription",
        icon: <AudioOutlined />,
      },
    ],
    [t],
  );

  return (
    <div className={styles.page}>
      <PageHeader
        parent={t("nav.settings")}
        current={t("settingsLanding.title")}
      />

      <div className={styles.hero}>
        <div className={styles.heroBadge}>{t("nav.settings")}</div>
        <h1 className={styles.heroTitle}>{t("settingsLanding.title")}</h1>
        <Paragraph className={styles.heroDescription}>
          {t("settingsLanding.description")}
        </Paragraph>
      </div>

      <div className={styles.grid}>
        {entries.map((entry) => (
          <Card
            key={entry.key}
            hoverable
            className={styles.card}
            onClick={() => navigate(entry.path)}
          >
            <div className={styles.cardTop}>
              <span className={styles.cardIcon}>{entry.icon}</span>
              <RightOutlined className={styles.cardArrow} />
            </div>
            <div className={styles.cardTitle}>{entry.title}</div>
            <Paragraph className={styles.cardDescription}>
              {entry.description}
            </Paragraph>
          </Card>
        ))}
      </div>
    </div>
  );
}
