import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/website/AuthContext";

export default function RoleRoute({ children, allow = [] }) {
  const { isAuth, roles } = useAuth();

  if (!isAuth) return <Navigate to="/login" replace />;

  const ok = allow.some((r) => roles.includes(r));

  if (!ok) return <Navigate to="/account" replace />;

  return children;
}
