import React, { useEffect, useMemo, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import "../../css/admin.css";
import { useAuth } from "../hooks/website/AuthContext";
import { useI18n } from "../hooks/website/I18nContext";

const NAV = [
  { to: "/admin", icon: "bi-speedometer2", label: "Dashboard" },
  { to: "/admin/products", icon: "bi-box-seam", label: "Products" },
  { to: "/admin/brands", icon: "bi-patch-check", label: "Brands" },
  { to: "/admin/categories", icon: "bi-tags", label: "Categories" },
  { to: "/admin/orders", icon: "bi-receipt", label: "Orders", badge: "New" },
  { to: "/admin/coupons", icon: "bi-ticket-perforated", label: "Coupons" },
  { to: "/admin/sliders", icon: "bi-images", label: "Sliders" },
  { to: "/admin/users", icon: "bi-people", label: "Users" },
  { to: "/admin/settings", icon: "bi-gear", label: "Settings" },

  // ✅ Logout action (pas une route)
  { action: "logout", icon: "bi-box-arrow-left", label: "Logout" },
];

function SidebarItem({ item, collapsed, onAction }) {
  const { to, icon, label, badge, action } = item;

  // ✅ Item action (logout)
  if (action) {
    return (
      <button
        type="button"
        title={collapsed ? label : undefined}
        className={[
          "nav-link",
          "d-flex",
          "align-items-center",
          "px-2",
          "py-2",
          "rounded-3",
          "mb-1",
          "text-light",
          "sidebar-link",
          "w-100",
          "border-0",
          "bg-transparent",
          "text-start",
        ].join(" ")}
        onClick={() => onAction(action)}
      >
        <span className="d-flex align-items-center gap-2 w-100">
          <span className="sidebar-icon d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0">
            <i className={`bi ${icon}`} />
          </span>

          {!collapsed && (
            <span className="fw-medium text-truncate" style={{ maxWidth: 150 }}>
              {label}
            </span>
          )}

          {!collapsed && badge ? (
            <span className="ms-auto badge text-bg-secondary">{badge}</span>
          ) : null}
        </span>
      </button>
    );
  }

  // ✅ NavLink normal
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          "nav-link",
          "d-flex",
          "align-items-center",
          "px-2",
          "py-2",
          "rounded-3",
          "mb-1",
          isActive ? "active bg-warning text-dark" : "text-light sidebar-link",
        ].join(" ")
      }
    >
      <span className="d-flex align-items-center gap-2 w-100">
        <span className="sidebar-icon d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0">
          <i className={`bi ${icon}`} />
        </span>

        {!collapsed && (
          <span className="fw-medium text-truncate" style={{ maxWidth: 150 }}>
            {label}
          </span>
        )}

        {!collapsed && badge ? (
          <span className="ms-auto badge text-bg-secondary">{badge}</span>
        ) : null}
      </span>
    </NavLink>
  );
}

function ConfirmModal({ open, title, message, confirmText, loading, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <>
      <div className="modal fade show" style={{ display: "block" }} aria-modal="true" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onCancel} disabled={loading} />
            </div>

            <div className="modal-body">
              <p className="mb-0">{message}</p>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline-secondary" onClick={onCancel} disabled={loading}>
                Annuler
              </button>
              <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Déconnexion...
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" onClick={loading ? undefined : onCancel} />
    </>
  );
}

export default function AdminLayout() {
  const { lang, setLang } = useI18n();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const { isAuth, logoutAdmin, roles } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  // ESC ferme drawer + modal
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setLogoutOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ✅ Redirection seulement si pas admin (ne force pas /admin en boucle)
  useEffect(() => {
    if (!isAuth) return;

    const r = Array.isArray(roles) ? roles : [];

    // ✅ si admin, ne force aucune redirection (laisse rester sur /admin/*)
    if (r.includes("admin")) return;

    // ✅ sinon on sort de l'admin
    if (r.includes("delivery")) {
      if (location.pathname !== "/delivery") nav("/delivery", { replace: true });
    } else {
      if (location.pathname !== "/") nav("/", { replace: true });
    }
  }, [isAuth, roles, nav, location.pathname]);

  // Bloquer scroll seulement quand drawer mobile est ouvert OU modal
  useEffect(() => {
    const lock = drawerOpen || logoutOpen;
    document.body.style.overflow = lock ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen, logoutOpen]);

  const sidebarWidth = useMemo(() => (collapsed ? 84 : 280), [collapsed]);

  function handleAction(action) {
    if (action === "logout") {
      setLogoutOpen(true);
      setDrawerOpen(false); // si on était en mobile drawer
    }
  }

  async function confirmLogout() {
    setLogoutLoading(true);
    try {
      await logoutAdmin();
      setLogoutOpen(false);
      nav("/login", { replace: true });
    } finally {
      setLogoutLoading(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-shell">
        {/* Desktop Sidebar */}
        <aside className="sidebar desktop d-none d-lg-flex flex-column p-3" style={{ width: sidebarWidth }}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="sidebar-header">
              <div className="fw-bold text-warning fs-5">{collapsed ? "M" : "MAHAKARAKARA"}</div>
            </div>
          </div>

          <nav className="mt-2">
            {NAV.map((item) => (
              <SidebarItem key={item.to ?? item.action} item={item} collapsed={collapsed} onAction={handleAction} />
            ))}
          </nav>

          <div className="mt-auto pt-3 border-top border-secondary">
            <a
              className={`btn btn-outline-light w-100 d-flex align-items-center justify-content-center gap-2 ${
                collapsed ? "px-2" : ""
              }`}
              href="/"
              title={collapsed ? "Retour site" : undefined}
            >
              <i className="bi bi-arrow-left" />
              {!collapsed && <span>Retour site</span>}
            </a>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {drawerOpen && <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />}
        <aside className={`sidebar-drawer d-lg-none ${drawerOpen ? "open" : ""}`}>
          <div className="p-3">
            <div className="d-flex align-items-start justify-content-between mb-3">
              <div>
                <div className="fw-bold text-warning fs-5">MAKARAKARA</div>
              </div>
              <button className="btn btn-sm btn-outline-light" type="button" onClick={() => setDrawerOpen(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <nav className="mt-2">
              {NAV.map((item) => (
                <SidebarItem key={item.to ?? item.action} item={item} collapsed={false} onAction={handleAction} />
              ))}
            </nav>

            <div className="mt-3 pt-3 border-top border-secondary">
              <a className="btn btn-outline-light w-100" href="/">
                <i className="bi bi-arrow-left me-2" />
                Retour site
              </a>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="admin-content">
          <header className="bg-white border-bottom">
            <div className="container-fluid py-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-outline-dark btn-sm d-lg-none"
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                >
                  <i className="bi bi-list" />
                </button>

                <button
                  className="btn btn-outline-dark btn-sm d-none d-lg-inline-flex"
                  type="button"
                  onClick={() => setCollapsed((v) => !v)}
                  title={collapsed ? "Étendre le menu" : "Réduire le menu"}
                >
                  <i className={`bi ${collapsed ? "bi-layout-sidebar-inset" : "bi-layout-sidebar"}`} />
                </button>

                <span className="fw-semibold">Dashboard</span>
                <span className="badge bg-warning text-dark">Admin</span>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button className="btn btn-outline-dark btn-sm" type="button">
                  <i className="bi bi-bell" />
                </button>

                <div className="dropdown">
                    <button
                      className="btn btn-outline-dark btn-sm dropdown-toggle"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      title="Langue"
                    >
                      <i className="bi bi-translate me-2" />
                      {lang.toUpperCase()}
                    </button>

                    <ul className="dropdown-menu dropdown-menu-end">
                      {["fr", "en", "es", "de"].map((l) => (
                        <li key={l}>
                          <button
                            className={`dropdown-item ${lang === l ? "active" : ""}`}
                            onClick={() => setLang(l)}
                            type="button"
                          >
                            {l.toUpperCase()}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                <button className="btn btn-dark btn-sm" type="button">
                  <i className="bi bi-person-circle me-2" />
                  Mon compte
                </button>
              </div>
            </div>
          </header>

          <main className="container-fluid py-4 admin-main">
            <Outlet />
          </main>

          <footer className="admin-footer">
            <div className="container-fluid py-3 d-flex flex-column flex-md-row gap-2 align-items-md-center justify-content-between">
              <div className="text-muted small">
                © {new Date().getFullYear()} MAKARAKARA — Admin Dashboard
              </div>
              <div className="text-muted small d-flex gap-3">
                <span className="d-inline-flex align-items-center gap-2">
                  <i className="bi bi-shield-lock" />
                  Sécurisé
                </span>
                <span className="d-inline-flex align-items-center gap-2">
                  <i className="bi bi-lightning-charge" />
                  Performance
                </span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* ✅ Modal Logout */}
      <ConfirmModal
        open={logoutOpen}
        title="Déconnexion"
        message="Voulez-vous vraiment vous déconnecter ?"
        confirmText="Oui, se déconnecter"
        loading={logoutLoading}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
