import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { AuthProvider } from "./hooks/website/AuthContext";
import { I18nProvider } from "./hooks/website/I18nContext";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";

createRoot(document.getElementById("app")).render(
  <React.StrictMode>
    <AuthProvider>
      <I18nProvider>
        <RouterProvider router={router} />
      </I18nProvider>
    </AuthProvider>
  </React.StrictMode>
);
