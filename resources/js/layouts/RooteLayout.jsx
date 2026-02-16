import { Outlet } from "react-router-dom";
import { AuthProvider } from "../hooks/website/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
