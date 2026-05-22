import React, { useEffect, useMemo, useState } from "react";
import { NotificationsApi } from "../../../api/admin_notifications";
import { useI18n } from "../../../hooks/website/I18nContext";

function formatDateTime(value, lang) {
  if (!value) return "-";
  return new Date(value).toLocaleString(lang === "en" ? "en-US" : lang);
}

function severityClass(severity) {
  switch (severity) {
    case "danger":
      return "text-bg-danger";
    case "warning":
      return "text-bg-warning";
    case "success":
      return "text-bg-success";
    default:
      return "text-bg-primary";
  }
}

function categoryLabel(category, t) {
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

function decodeLabel(label) {
  const map = { "&laquo;": "<<", "&raquo;": ">>" };
  return (label || "").replace(/&laquo;|&raquo;/g, (m) => map[m] ?? m);
}

export default function NotificationsPage() {
  const { lang, t } = useI18n();
  const [pager, setPager] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function load({ nextPage = page, mode = "refresh", unread = unreadOnly } = {}) {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);

    setError("");

    try {
      const result = await NotificationsApi.list({
        page: nextPage,
        perPage: 15,
        unreadOnly: unread,
      });

      setPager(result.pager);
      setUnreadCount(result.unreadCount);
      setPage(result.pager?.current_page ?? nextPage);
    } catch (err) {
      setError(err?.response?.data?.message || t("notifications.error.load", "Unable to load notifications."));
    } finally {
      if (mode === "initial") setLoading(false);
      else setRefreshing(false);
    }
  }

  useEffect(() => {
    load({ nextPage: 1, mode: "initial", unread: unreadOnly });
  }, [unreadOnly]);

  const rows = useMemo(() => pager?.data || [], [pager]);

  async function handleMarkAsRead(item) {
    if (item?.is_read) return;

    try {
      const result = await NotificationsApi.markAsRead(item.id);
      setUnreadCount(result.unreadCount);
      setPager((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          data: (prev.data || []).map((row) =>
            row.id === item.id ? { ...row, is_read: true, read_at: result.item?.read_at || row.read_at } : row
          ),
        };
      });
    } catch {}
  }

  async function handleMarkAllAsRead() {
    try {
      await NotificationsApi.markAllAsRead();
      setUnreadCount(0);
      await load({ nextPage: page, mode: "refresh", unread: unreadOnly });
    } catch (err) {
      setError(err?.response?.data?.message || t("notifications.error.markAllRead", "Unable to mark notifications as read."));
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
        <div>
          <h4 className="mb-1">{t("notifications.title", "Notifications")}</h4>
          <div className="text-muted small">{t("notifications.subtitle", "Admin notification center with full history.")}</div>
          <div className="text-muted small">
            {t("notifications.summary.unread", "Unread")}: {unreadCount} | {t("notifications.summary.total", "Total")}: {pager?.total ?? 0}
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn ${unreadOnly ? "btn-warning" : "btn-outline-warning"}`}
            onClick={() => setUnreadOnly((prev) => !prev)}
          >
            {unreadOnly ? t("notifications.actions.showAll", "Show all") : t("notifications.actions.showUnread", "Show unread")}
          </button>
          <button type="button" className="btn btn-outline-dark" onClick={() => load({ nextPage: page, mode: "refresh" })}>
            {refreshing ? t("notifications.actions.refreshing", "Refreshing...") : t("notifications.actions.refresh", "Refresh")}
          </button>
          <button type="button" className="btn btn-dark" onClick={handleMarkAllAsRead} disabled={!unreadCount}>
            {t("notifications.actions.markAllRead", "Mark all as read")}
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {error ? <div className="alert alert-danger">{error}</div> : null}

          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <span className="spinner-border spinner-border-sm" />
              {t("notifications.loading", "Loading...")}
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center text-muted py-5">{t("notifications.empty", "No notifications.")}</div>
          ) : (
            <>
              <div className="row g-3">
                {rows.map((item) => (
                  <div className="col-12 col-xl-6" key={item.id}>
                    <div className={`card h-100 border ${item.is_read ? "bg-light" : "border-warning-subtle"}`}>
                      <div className="card-body d-flex flex-column gap-3">
                        <div className="d-flex align-items-start justify-content-between gap-3">
                          <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span className={`badge ${severityClass(item.severity)}`}>{categoryLabel(item.category, t)}</span>
                              {!item.is_read ? <span className="badge text-bg-warning">{t("notifications.badges.unread", "Unread")}</span> : null}
                            </div>
                            <div className="fw-semibold">{item.title}</div>
                          </div>
                          <div className="small text-muted text-end">{formatDateTime(item.created_at, lang)}</div>
                        </div>

                        <div className="text-secondary">{item.message}</div>

                        <div className="small text-muted">
                          {item.entity_id
                            ? `${t("notifications.meta.reference", "Reference")} #${item.entity_id}`
                            : t("notifications.meta.noReference", "No direct reference")}
                          {item.read_at ? ` | ${t("notifications.meta.readAt", "Read on")} ${formatDateTime(item.read_at, lang)}` : ""}
                        </div>

                        <div className="d-flex flex-wrap gap-2 mt-auto">
                          {!item.is_read ? (
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleMarkAsRead(item)}>
                              {t("notifications.actions.markRead", "Mark as read")}
                            </button>
                          ) : null}
                          {item.action_url ? (
                            <a className="btn btn-sm btn-outline-dark" href={item.action_url}>
                              {t("notifications.actions.open", "Open")}
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {pager?.links?.length ? (
                <div className="d-flex justify-content-center mt-4">
                  <div className="btn-group">
                    {pager.links.map((link, index) => {
                      const disabled = !link.url;
                      const nextPage = link.url ? Number(new URL(link.url).searchParams.get("page")) : null;

                      return (
                        <button
                          key={index}
                          type="button"
                          className={`btn btn-sm ${link.active ? "btn-dark" : "btn-outline-dark"}`}
                          disabled={disabled || refreshing}
                          onClick={() => nextPage && load({ nextPage, mode: "refresh" })}
                          dangerouslySetInnerHTML={{ __html: decodeLabel(link.label) }}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
