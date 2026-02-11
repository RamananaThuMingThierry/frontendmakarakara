import { Navigate } from "react-router-dom";

export function RequireAuth({ children }) {
  const token = localStorage.getItem("token"); // ou store
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export function RequireRole({ role, children }) {
  const userRole = localStorage.getItem("role"); // ou store
  if (userRole !== role) return <Navigate to="/" replace />;
  return children;
}
