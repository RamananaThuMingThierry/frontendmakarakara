import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/website/AuthContext";

export default function Account() {
  const { user, logout } = useAuth();

  return (
    <main className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        <div className="d-flex flex-column flex-md-row align-items-start justify-content-between gap-3 mb-4">
          <div>
            <h1 className="fw-bold mb-1">Mon compte</h1>
            <p className="text-secondary mb-0">
              Bonjour <span className="fw-semibold">{user?.name}</span>
            </p>
          </div>
          <button className="btn btn-outline-danger" onClick={logout} type="button">
            <i className="bi bi-box-arrow-right me-2" />
            Déconnexion
          </button>
        </div>

        <div className="row g-4">
          {/* Profil */}
          <div className="col-12 col-lg-4">
            <div className="bg-white rounded-4 shadow-sm p-4">
              <h5 className="fw-bold mb-3">Informations</h5>
              <div className="text-secondary mb-2">
                <span className="fw-semibold text-dark">Nom :</span> {user?.name}
              </div>
              <div className="text-secondary mb-2">
                <span className="fw-semibold text-dark">Email :</span> {user?.email}
              </div>

              <Link className="btn btn-dark w-100 mt-3" to="/account/orders">
                Voir mes commandes
              </Link>
            </div>
          </div>

          {/* Historique (placeholder) */}
          <div className="col-12 col-lg-8">
            <div className="bg-white rounded-4 shadow-sm p-4">
              <h5 className="fw-bold mb-3">Historique</h5>
              <div className="alert alert-warning mb-0">
                Ici on affichera la liste des commandes depuis Laravel (API).
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
