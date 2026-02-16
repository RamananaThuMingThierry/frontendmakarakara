import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/website/AuthContext";

export default function RoleRoute({ children, allow = [] }) {
  const { isAuth, roles, hydrating } = useAuth();
  const location = useLocation();

  if (hydrating) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const r = Array.isArray(roles) ? roles : [];

  // si route basée sur rôle, attendre roles si pas encore chargés
  if (allow.length > 0 && r.length === 0) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  const ok = allow.length === 0 || allow.some((x) => r.includes(x));
  if (!ok) return <Navigate to="/" replace />;

  return children;
}
