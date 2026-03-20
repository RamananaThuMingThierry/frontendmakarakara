import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/website/AuthContext";

export default function ClientMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: "/", label: "Retour au site", icon: "bi-arrow-left" },
    { to: "/account/profile", label: "Mon profil", icon: "bi-person" },
    { to: "/account/reservations", label: "Mes reservations", icon: "bi-bookmark-check" },
    { to: "/account/orders", label: "Mes commandes", icon: "bi-bag-check" },
  ];

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true, state: { message: "Vous etes deconnecte." } });
  }

  return (
    <div className="bg-white rounded-4 shadow-sm p-4">
      <div className="mb-4">
        <div className="small text-uppercase text-secondary fw-semibold mb-2">Espace client</div>
        <h2 className="h5 fw-bold mb-1">{user?.name || "Client"}</h2>
        <p className="text-secondary mb-0">{user?.email || "Email non disponible"}</p>
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
        Deconnexion
      </button>
    </div>
  );
}
