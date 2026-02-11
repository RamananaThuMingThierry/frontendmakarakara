import { createBrowserRouter } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import ClientLayout from "../layouts/ClientLayout";
import AdminLayout from "../layouts/AdminLayout";
import ClientDashboard from "../pages/client/ClientDashboard";
import Home from "../pages/public/Home";

import { RequireAuth, RequireRole } from "./guards";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      // autres pages public: products, cart...
    ],
  },
  {
    path: "/client",
    element: (
      <RequireAuth>
        <ClientLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <ClientDashboard /> },
      // orders, profile...
    ],
  },
  {
    path: "/admin",
    element: (
      <RequireAuth>
        <RequireRole role="admin">
          <AdminLayout />
        </RequireRole>
      </RequireAuth>
    ),
    children: [
      // { index: true, element: <AdminDashboard /> },
      // brands, categories...
    ],
  },
]);
