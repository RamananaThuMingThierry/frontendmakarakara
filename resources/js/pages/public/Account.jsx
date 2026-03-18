import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/website/AuthContext";

export default function Account() {
  const { roles } = useAuth();
  const safeRoles = Array.isArray(roles) ? roles : [];

  if (safeRoles.includes("admin")) {
    return <Navigate to="/admin/account" replace />;
  }

  return <Navigate to="/account/profile" replace />;
}
