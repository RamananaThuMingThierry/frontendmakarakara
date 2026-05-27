import React, { useEffect, useMemo, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import "../../css/admin.css";
import { useAuth } from "../hooks/website/AuthContext";
import { useI18n } from "../hooks/website/I18nContext";
import { NotificationsApi } from "../api/admin_notifications";

function buildAvatarUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const apiUrl = import.meta.env.VITE_API_URL || "http://192.168.0.17:8000/api";
  const base = apiUrl.replace(/\/api\/?$/, "");
  return `${base}/${String(path).replace(/^\/+/, "")}`;
}

const NAV = [
  { to: "/admin/dashboard", icon: "bi-speedometer2", labelKey: "dashboard", fallback: "Dashboard" },
  { to: "/admin/categories", icon: "bi-tags", labelKey: "categories", fallback: "Categories" },
  { to: "/admin/brands", icon: "bi-patch-check", labelKey: "brands", fallback: "Brands" },
  { to: "/admin/orders", icon: "bi-receipt", labelKey: "orders", fallback: "Orders" },
  { to: "/admin/coupons", icon: "bi-ticket-perforated", labelKey: "coupons", fallback: "Coupons" },
  { to: "/admin/testimonials", icon: "bi-chat-square-quote", labelKey: "testimonials", fallback: "Testimonials" },
  { to: "/admin/gallery", icon: "bi-card-image", labelKey: "gallery", fallback: "Gallery" },
  { to: "/admin/reservations", icon: "bi-bookmark-check", labelKey: "reservations", fallback: "Reservations" },
  { to: "/admin/sliders", icon: "bi-images", labelKey: "sliders", fallback: "Banners" },
  { to: "/admin/users", icon: "bi-people", labelKey: "users", fallback: "Users" },
  { to: "/admin/contacts", icon: "bi-envelope-paper", labelKey: "contacts", fallback: "Messages" },
  { to: "/admin/settings", icon: "bi-gear", labelKey: "settings", fallback: "Settings" },
  { to: "/admin/activity-logs", icon: "bi-file-earmark-text", labelKey: "activityLogs", fallback: "Activity logs" },
  { to: "/admin/account", icon: "bi-person-circle", labelKey: "account", fallback: "My account" },
  { action: "logout", icon: "bi-box-arrow-left", labelKey: "logout", fallback: "Logout" },
];

function SidebarItem({ item, collapsed, onAction }) {
  const { to, icon, label, badge, action } = item;

  if (action) {
    return (
      <button
        type="button"
        title={collapsed ? label : undefined}
        className={["nav-link", "d-flex", "align-items-center", "px-2", "py-2", "rounded-3", "mb-1", "text-light", "sidebar-link", "w-100", "border-0", "bg-transparent", "text-start"].join(" ")}
        onClick={() => onAction(action)}
      >
        <span className="d-flex align-items-center gap-2 w-100">
          <span className="sidebar-icon d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0"><i className={`bi ${icon}`} /></span>
          {!collapsed && <span className="fw-medium text-truncate" style={{ maxWidth: 150 }}>{label}</span>}
          {!collapsed && badge ? <span className="ms-auto badge text-bg-secondary">{badge}</span> : null}
        </span>
      </button>
    );
  }

  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) => ["nav-link", "d-flex", "align-items-center", "px-2", "py-2", "rounded-3", "mb-1", isActive ? "active bg-warning text-dark" : "text-light sidebar-link"].join(" ")}
    >
      <span className="d-flex align-items-center gap-2 w-100">
        <span className="sidebar-icon d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0"><i className={`bi ${icon}`} /></span>
        {!collapsed && <span className="fw-medium text-truncate" style={{ maxWidth: 150 }}>{label}</span>}
        {!collapsed && badge ? <span className="ms-auto badge text-bg-secondary">{badge}</span> : null}
      </span>
    </NavLink>
  );
}

function notificationBadgeClass(severity) {
  switch (severity) {
    case "danger": return "text-bg-danger";
    case "warning": return "text-bg-warning";
    case "success": return "text-bg-success";
    default: return "text-bg-primary";
  }
}

function notificationCategoryLabel(category, t) {
  const map = {
    order: t("notifications.categories.order", "Order"),
    reservation: t("notifications.categories.reservation", "Reservation"),
    contact: t("notifications.categories.contact", "Contact"),
    review: t("notifications.categories.review", "Review"),
    inventory: t("notifications.categories.inventory", "Inventory"),
    system: t("notifications.categories.system", "System"),
  };

  return map[category] || category || t("notifications.categories.default", "Notification");
}

function ConfirmModal({ open, title, message, confirmText, cancelText, loadingText, loading, onCancel, onConfirm }) {
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
            <div className="modal-body"><p className="mb-0">{message}</p></div>
            <div className="modal-footer">
              <button className="btn btn-outline-secondary" onClick={onCancel} disabled={loading}>{cancelText}</button>
              <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2" />{loadingText}</> : confirmText}
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
  const { lang, setLang, t } = useI18n();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationItems, setNotificationItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { isAuth, logoutAdmin, roles, user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const headerAvatar = buildAvatarUrl(user?.avatar);

  const navItems = useMemo(() => NAV.map((item) => ({ ...item, label: t(`adminLayout.nav.${item.labelKey}`, item.fallback) })), [t]);
  const sidebarWidth = useMemo(() => (collapsed ? 84 : 280), [collapsed]);

  const formatNotificationDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString(lang === "en" ? "en-US" : lang);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setLogoutOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    const r = Array.isArray(roles) ? roles : [];
    if (r.includes("admin")) return;
    if (r.includes("delivery")) {
      if (location.pathname !== "/delivery") nav("/delivery", { replace: true });
    } else if (location.pathname !== "/") {
      nav("/", { replace: true });
    }
  }, [isAuth, roles, nav, location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen || logoutOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen, logoutOpen]);

  useEffect(() => {
    setNotificationsOpen(false);
    setDrawerOpen(false);
  }, [location.pathname]);

  async function loadNotifications() {
    if (!isAuth || !(Array.isArray(roles) && roles.includes("admin"))) return;
    setNotificationsLoading(true);
    try {
      const result = await NotificationsApi.summary(6);
      setNotificationItems(Array.isArray(result?.items) ? result.items : []);
      setUnreadCount(Number(result?.unread_count || 0));
    } catch {
      setNotificationItems([]);
      setUnreadCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuth || !(Array.isArray(roles) && roles.includes("admin"))) return;
    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(intervalId);
  }, [isAuth, roles]);

  function handleAction(action) {
    if (action === "logout") {
      setLogoutOpen(true);
      setDrawerOpen(false);
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

  async function handleNotificationClick(item) {
    try {
      if (!item?.is_read) {
        const result = await NotificationsApi.markAsRead(item.id);
        setUnreadCount(result.unreadCount);
      }
    } catch {}
    setNotificationsOpen(false);
    nav(item?.action_url || "/admin/notifications");
  }

  async function handleMarkAllNotificationsAsRead() {
    try {
      await NotificationsApi.markAllAsRead();
      setUnreadCount(0);
      setNotificationItems((items) => items.map((item) => ({ ...item, is_read: true, read_at: new Date().toISOString() })));
    } catch {}
  }

  return (
    <div className="admin-page" style={{ "--admin-sidebar-width": `${sidebarWidth}px` }}>
      <div className="admin-shell">
        <aside className="sidebar desktop d-none d-lg-flex flex-column p-3" style={{ width: sidebarWidth }}>
          <div className="d-flex align-items-center justify-content-between mb-3"><div className="sidebar-header"><div className="fw-bold text-warning fs-5">{collapsed ? "M" : "MAHAKARAKARA"}</div></div></div>
          <nav className="mt-2 sidebar-nav">{navItems.map((item) => <SidebarItem key={item.to ?? item.action} item={item} collapsed={collapsed} onAction={handleAction} />)}</nav>
          <div className="mt-auto pt-3 border-top border-secondary sidebar-footer">
            <a className={`btn btn-outline-light w-100 d-flex align-items-center justify-content-center gap-2 ${collapsed ? "px-2" : ""}`} href="/" title={collapsed ? t("adminLayout.sidebar.backToSite", "Back to site") : undefined}>
              <i className="bi bi-arrow-left" />
              {!collapsed && <span>{t("adminLayout.sidebar.backToSite", "Back to site")}</span>}
            </a>
          </div>
        </aside>

        {drawerOpen && <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />}
        <aside className={`sidebar-drawer d-lg-none ${drawerOpen ? "open" : ""}`}>
          <div className="p-3 sidebar-drawer-inner">
            <div className="d-flex align-items-start justify-content-between mb-3"><div><div className="fw-bold text-warning fs-5">MAKARAKARA</div></div><button className="btn btn-sm btn-outline-light" type="button" onClick={() => setDrawerOpen(false)}><i className="bi bi-x-lg" /></button></div>
            <nav className="mt-2 sidebar-nav">{navItems.map((item) => <SidebarItem key={item.to ?? item.action} item={item} collapsed={false} onAction={handleAction} />)}</nav>
            <div className="mt-3 pt-3 border-top border-secondary sidebar-footer"><a className="btn btn-outline-light w-100" href="/"><i className="bi bi-arrow-left me-2" />{t("adminLayout.sidebar.backToSite", "Back to site")}</a></div>
          </div>
        </aside>

        <div className="admin-content">
          <header className="bg-white border-bottom">
            <div className="container-fluid py-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <button className="btn btn-outline-dark btn-sm d-lg-none" type="button" onClick={() => setDrawerOpen(true)}><i className="bi bi-list" /></button>
                <button className="btn btn-outline-dark btn-sm d-none d-lg-inline-flex" type="button" onClick={() => setCollapsed((v) => !v)} title={collapsed ? t("adminLayout.sidebar.expand", "Expand menu") : t("adminLayout.sidebar.collapse", "Collapse menu")}><i className={`bi ${collapsed ? "bi-layout-sidebar-inset" : "bi-layout-sidebar"}`} /></button>
                <span className="fw-semibold">{t("adminLayout.header.dashboard", "Dashboard")}</span>
                <span className="badge bg-warning text-dark">{t("adminLayout.header.admin", "Admin")}</span>
              </div>

              <div className="d-flex align-items-center gap-2 position-relative">
                <div className="position-relative">
                  <button className="btn btn-outline-dark btn-sm position-relative" type="button" onClick={() => { const next = !notificationsOpen; setNotificationsOpen(next); if (!notificationsOpen) loadNotifications(); }}>
                    <i className="bi bi-bell" />
                    {unreadCount > 0 ? <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill text-bg-danger" style={{ fontSize: 10 }}>{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
                  </button>

                  {notificationsOpen ? (
                    <div className="position-absolute end-0 mt-2 bg-white border rounded-4 shadow-sm" style={{ width: 360, maxWidth: "calc(100vw - 2rem)", zIndex: 1050 }}>
                      <div className="p-3 border-bottom d-flex align-items-center justify-content-between gap-2">
                        <div>
                          <div className="fw-semibold">{t("adminLayout.header.notifications", "Notifications")}</div>
                          <div className="small text-secondary">{unreadCount} {t("adminLayout.header.unread", "unread")}</div>
                        </div>
                        <button type="button" className="btn btn-sm btn-link text-decoration-none" onClick={handleMarkAllNotificationsAsRead} disabled={!unreadCount}>{t("adminLayout.header.markAllRead", "Mark all as read")}</button>
                      </div>
                      <div style={{ maxHeight: 420, overflowY: "auto" }}>
                        {notificationsLoading ? <div className="p-3 text-secondary small">{t("adminLayout.header.loading", "Loading...")}</div> : notificationItems.length ? notificationItems.map((item) => (
                          <button key={item.id} type="button" className={`w-100 text-start border-0 bg-transparent p-3 border-bottom ${item.is_read ? "opacity-75" : ""}`} onClick={() => handleNotificationClick(item)}>
                            <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
                              <span className={`badge ${notificationBadgeClass(item.severity)}`}>{notificationCategoryLabel(item.category, t)}</span>
                              {!item.is_read ? <span className="badge text-bg-warning">{t("adminLayout.header.new", "New")}</span> : null}
                            </div>
                            <div className="fw-semibold small">{item.title}</div>
                            <div className="small text-secondary">{item.message}</div>
                            <div className="small text-muted mt-1">{formatNotificationDate(item.created_at)}</div>
                          </button>
                        )) : <div className="p-3 text-secondary small">{t("adminLayout.header.empty", "No notifications.")}</div>}
                      </div>
                      <div className="p-3"><button type="button" className="btn btn-warning w-100" onClick={() => { setNotificationsOpen(false); nav("/admin/notifications"); }}>{t("adminLayout.header.viewMore", "View more")}</button></div>
                    </div>
                  ) : null}
                </div>

                <div className="dropdown">
                  <button className="btn btn-outline-dark btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title={t("adminLayout.header.language", "Language")}>
                    <i className="bi bi-translate me-2" />{lang.toUpperCase()}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">{["fr", "en", "es", "de"].map((l) => <li key={l}><button className={`dropdown-item ${lang === l ? "active" : ""}`} onClick={() => setLang(l)} type="button">{l.toUpperCase()}</button></li>)}</ul>
                </div>

                <button className="btn btn-warning btn-sm d-inline-flex align-items-center gap-2" type="button" onClick={() => nav("/admin/account")}>
                  {headerAvatar ? <span className="admin-header-avatar"><img src={headerAvatar} alt={user?.name || t("adminLayout.header.account", "My account")} /></span> : <i className="bi bi-person-circle" />}
                  {t("adminLayout.header.account", "My account")}
                </button>
              </div>
            </div>
          </header>

          <main className="container-fluid py-4 admin-main"><Outlet /></main>

          <footer className="admin-footer">
            <div className="container-fluid py-3 d-flex flex-column flex-md-row gap-2 align-items-md-center justify-content-between">
              <div className="text-muted small">© {new Date().getFullYear()} MAKARAKARA - {t("adminLayout.footer.adminDashboard", "Admin Dashboard")}</div>
              <div className="text-muted small d-flex gap-3">
                <span className="d-inline-flex align-items-center gap-2"><i className="bi bi-shield-lock" />{t("adminLayout.footer.secure", "Secure")}</span>
                <span className="d-inline-flex align-items-center gap-2"><i className="bi bi-lightning-charge" />{t("adminLayout.footer.performance", "Performance")}</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <ConfirmModal
        open={logoutOpen}
        title={t("adminLayout.logout.title", "Logout")}
        message={t("adminLayout.logout.message", "Do you really want to log out?")}
        confirmText={t("adminLayout.logout.confirm", "Yes, log out")}
        cancelText={t("adminLayout.logout.cancel", "Cancel")}
        loadingText={t("adminLayout.logout.loading", "Logging out...")}
        loading={logoutLoading}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
