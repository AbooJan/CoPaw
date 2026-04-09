import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./SettingsBreadcrumbLink.module.less";

export default function SettingsBreadcrumbLink() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={styles.link}
      onClick={() => navigate("/settings")}
    >
      {t("nav.settings")}
    </button>
  );
}
