import { useI18n } from "../../hooks/website/I18nContext";

export default function ClientDashboard() {
  const { t } = useI18n();

  return (
    <div className="bg-white rounded-4 shadow-sm p-4">
      <h1 className="h4 fw-bold mb-2">{t("account.dashboard.title", "Tableau de bord client")}</h1>
      <p className="text-secondary mb-0">
        {t("account.dashboard.subtitle", "Accedez a votre profil, vos reservations et vos commandes depuis cet espace.")}
      </p>
    </div>
  );
}
