import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/website/AuthContext";
import { useI18n } from "../../hooks/website/I18nContext";

export default function ClientMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const links = [
    { to: "/", label: t("account.menu.backToSite", "Retour au site"), icon: "bi-arrow-left" },
    { to: "/account/profile", label: t("account.menu.profile", "Mon profil"), icon: "bi-person" },
    { to: "/account/reservations", label: t("account.menu.reservations", "Mes reservations"), icon: "bi-bookmark-check" },
    { to: "/account/orders", label: t("account.menu.orders", "Mes commandes"), icon: "bi-bag-check" },
  ];

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true, state: { message: t("account.menu.loggedOut", "Vous etes deconnecte.") } });
  }

  return (
    <div className="bg-white rounded-4 shadow-sm p-4">
      <div className="mb-4">
        <div className="small text-uppercase text-secondary fw-semibold mb-2">{t("account.menu.title", "Espace client")}</div>
        <h2 className="h5 fw-bold mb-1">{user?.name || t("account.menu.clientFallback", "Client")}</h2>
        <p className="text-secondary mb-0">{user?.email || t("account.menu.emailUnavailable", "Email non disponible")}</p>
      </div>

      <div className="d-flex flex-column gap-2">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `btn text-start ${isActive ? "btn-dark" : "btn-outline-dark"}`}
          >
            <i className={`bi ${item.icon} me-2`} />
            {item.label}
          </NavLink>
        ))}
      </div>

      <button className="btn btn-outline-danger w-100 mt-4" type="button" onClick={handleLogout}>
        <i className="bi bi-box-arrow-right me-2" />
        {t("account.menu.logout", "Deconnexion")}
      </button>
    </div>
  );
}
