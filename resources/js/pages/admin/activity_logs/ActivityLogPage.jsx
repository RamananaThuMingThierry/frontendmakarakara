import React, { useEffect, useMemo, useState } from "react";
import { activityLogsApi } from "../../../api/activity_logs";
import { useI18n } from "../../../hooks/website/I18nContext";

function formatDate(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

function decodeLabel(label) {
  const map = { "&laquo;": "«", "&raquo;": "»" };
  return (label || "").replace(/&laquo;|&raquo;/g, (m) => map[m] ?? m);
}

function PrettyJSON({ value }) {
  let obj = value;

  if (typeof obj === "string") {
    try {
      obj = JSON.parse(obj);
    } catch {}
  }

  let text = "";
  try {
    text = JSON.stringify(obj ?? null, null, 2);
  } catch {
    text = String(obj ?? "");
  }

  return (
    <pre className="bg-light p-3 rounded-3 mb-0" style={{ maxHeight: 360, overflow: "auto" }}>
      {text}
    </pre>
  );
}

function getActionStyle(log = {}) {
  const action = String(log?.action ?? "").toLowerCase();
  const color = String(log?.color ?? "").toLowerCase();
  const status = Number(log?.status_code ?? 0);
  const method = String(log?.method ?? "").toUpperCase();

  if (color === "danger" || status >= 500 || action.includes("failed") || action.includes("error")) {
    return { badge: "text-bg-danger", icon: "bi-x-octagon", border: "border-danger-subtle" };
  }

  if (color === "warning" || status >= 400) {
    return { badge: "text-bg-warning", icon: "bi-exclamation-triangle", border: "border-warning-subtle" };
  }

  if (color === "success" || method === "POST" || action.startsWith("create")) {
    return { badge: "text-bg-success", icon: "bi-check-circle", border: "border-success-subtle" };
  }

  if (color === "primary" || method === "PUT" || method === "PATCH" || action.startsWith("update")) {
    return { badge: "text-bg-primary", icon: "bi-pencil-square", border: "border-primary-subtle" };
  }

  if (method === "DELETE" || action.startsWith("delete")) {
    return { badge: "text-bg-danger", icon: "bi-trash3", border: "border-danger-subtle" };
  }

  return { badge: "text-bg-secondary", icon: "bi-activity", border: "border-secondary-subtle" };
}

function methodBadgeClass(method) {
  switch (String(method ?? "").toUpperCase()) {
    case "GET":
      return "text-bg-info";
    case "POST":
      return "text-bg-success";
    case "PUT":
    case "PATCH":
      return "text-bg-primary";
    case "DELETE":
      return "text-bg-danger";
    default:
      return "text-bg-secondary";
  }
}

function statusBadgeClass(statusCode) {
  const status = Number(statusCode ?? 0);

  if (status >= 500) return "text-bg-danger";
  if (status >= 400) return "text-bg-warning";
  if (status >= 200) return "text-bg-success";
  return "text-bg-secondary";
}

function compactText(value, fallback = "—") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function buildSummaryFields(log) {
  return [
    { label: "Message", value: log?.message },
    { label: "Utilisateur", value: log?.user?.name || log?.user?.email || (log?.user_id ? `#${log.user_id}` : "") },
    { label: "Entite", value: log?.entity_type ? `${log.entity_type}${log?.entity_id ? ` #${log.entity_id}` : ""}` : "" },
    { label: "Route", value: log?.route },
    { label: "URL", value: log?.url },
  ].filter((item) => String(item.value ?? "").trim() !== "");
}

function buildDetailFields(log) {
  return [
    { label: "ID", value: log?.id },
    { label: "Action", value: log?.action },
    { label: "Couleur", value: log?.color },
    { label: "Methode", value: log?.method },
    { label: "Status HTTP", value: log?.status_code },
    { label: "Utilisateur", value: log?.user?.name || log?.user?.email || (log?.user_id ? `#${log.user_id}` : "") },
    { label: "User ID", value: log?.user_id },
    { label: "Entite", value: log?.entity_type },
    { label: "Entity ID", value: log?.entity_id },
    { label: "Route", value: log?.route },
    { label: "URL", value: log?.url },
    { label: "Message", value: log?.message },
    { label: "Cree le", value: formatDate(log?.created_at) },
    { label: "Modifie le", value: formatDate(log?.updated_at) },
  ].filter((item) => item.value !== null && item.value !== undefined && String(item.value).trim() !== "");
}

export default function ActivityLogPage() {
  const { t } = useI18n();

  const [pager, setPager] = useState(null);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");

  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  function showToast(type, message) {
    setToast({ open: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast((x) => ({ ...x, open: false })), 3500);
  }

  const [showOpen, setShowOpen] = useState(false);
  const [showing, setShowing] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  async function load({ page: p = 1, mode = "initial" } = {}) {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);

    setErr("");
    try {
      const data = await activityLogsApi.list({ page: p });
      setPager(data);
      setPage(data?.current_page ?? p);
    } catch (e) {
      setErr(e?.response?.data?.message || t("activityLogs.errors.load", "Unable to load logs."));
    } finally {
      if (mode === "initial") setLoading(false);
      else setRefreshing(false);
    }
  }

  useEffect(() => {
    load({ page: 1, mode: "initial" });
  }, []);

  const rows = pager?.data ?? [];

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((r) =>
      [
        r?.id,
        r?.action,
        r?.color,
        r?.entity_type,
        r?.entity_id,
        r?.method,
        r?.route,
        r?.url,
        r?.status_code,
        r?.message,
        r?.user?.name,
        r?.user?.email,
        JSON.stringify(r?.metadata ?? ""),
      ]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [rows, q]);

  async function openShow(row) {
    setShowOpen(true);
    setShowing(row);

    try {
      const fullLog = await activityLogsApi.show(getRowId(row));
      setShowing(fullLog);
    } catch {}
  }

  function closeShow() {
    setShowOpen(false);
    setShowing(null);
  }

  function onDeleteAsk(row) {
    setDeleteTarget(row);
    setDeleteOpen(true);
  }

  function closeDelete() {
    if (deleting) return;
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);

    try {
      await activityLogsApi.remove(getRowId(deleteTarget));
      showToast("success", t("activityLogs.toast.deleted", "Deleted."));
      await load({ page, mode: "refresh" });
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (e) {
      const msg = e?.response?.data?.message || t("activityLogs.toast.deleteFailed", "Delete failed.");
      showToast("danger", msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">{t("activityLogs.title", "Activity logs")}</h4>
          <div className="text-muted small">{t("activityLogs.subtitle", "Track admin actions")}</div>
          <div className="text-muted small">
            {t("activityLogs.total", "Total")}: {pager?.total ?? "—"} • {t("activityLogs.page", "Page")}{" "}
            {pager?.current_page ?? "—"} / {pager?.last_page ?? "—"}
          </div>
        </div>

        <div className="d-flex gap-2">
          <input
            className="form-control"
            style={{ width: 320 }}
            placeholder={t("activityLogs.search", "Search in all visible fields")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            disabled={loading}
          />

          <button
            className="btn btn-outline-secondary"
            onClick={() => load({ page, mode: "refresh" })}
            disabled={loading || refreshing}
          >
            {loading || refreshing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                {t("activityLogs.refreshing", "Refreshing...")}
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2" />
                {t("activityLogs.refresh", "Refresh")}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm" style={{ backgroundColor: "#f6f6f6" }}>
        <div className="card-body">
          {err ? <div className="alert alert-danger">{err}</div> : null}

          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <span className="spinner-border spinner-border-sm" />
              {t("activityLogs.loading", "Loading...")}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted py-4">{t("activityLogs.empty", "No logs found.")}</div>
          ) : (
            <>
              <div className="row g-3">
                {filtered.map((r) => {
                  const style = getActionStyle(r);
                  const summaryFields = buildSummaryFields(r).slice(0, 3);

                  return (
                    <div className="col-12 col-md-6 col-xl-4" key={r.id}>
                      <div className={`card h-100 border ${style.border} shadow-sm`}>
                        <div className="card-body d-flex flex-column gap-3">
                          <div className="d-flex align-items-start justify-content-between gap-2">
                            <div>
                              <div className="text-muted small">
                                {t("activityLogs.card.id", "Log")} #{r.id}
                              </div>
                              <div className="fw-semibold text-break">{compactText(r.action)}</div>
                            </div>

                            <span className={`badge ${style.badge}`}>
                              <i className={`bi ${style.icon} me-1`} />
                              {compactText(r.color, "log")}
                            </span>
                          </div>

                          <div className="d-flex flex-wrap gap-2">
                            {r?.method ? (
                              <span className={`badge ${methodBadgeClass(r.method)}`}>{r.method}</span>
                            ) : null}
                            {r?.status_code ? (
                              <span className={`badge ${statusBadgeClass(r.status_code)}`}>{r.status_code}</span>
                            ) : null}
                            {r?.entity_type ? (
                              <span className="badge text-bg-light border text-dark">
                                {r.entity_type}
                                {r?.entity_id ? ` #${r.entity_id}` : ""}
                              </span>
                            ) : null}
                          </div>

                          {r?.message ? (
                            <div className="small text-dark bg-light rounded-3 p-3">{r.message}</div>
                          ) : null}

                          <div className="d-flex flex-column gap-2">
                            {summaryFields.map((item) => (
                              <div key={item.label}>
                                <div className="text-muted small">{item.label}</div>
                                <div className="text-break">{compactText(item.value)}</div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-auto pt-2 border-top">
                            <div className="text-muted small">{t("activityLogs.card.date", "Date")}</div>
                            <div className="text-break">{formatDate(r.created_at)}</div>
                          </div>
                        </div>

                        <div className="card-footer bg-white border-0 pt-0">
                          <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => openShow(r)}>
                              <i className="bi bi-eye me-2" />
                              {t("activityLogs.actions.show", "Show")}
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => onDeleteAsk(r)}>
                              <i className="bi bi-trash3 me-2" />
                              {t("activityLogs.actions.delete", "Delete")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {pager?.links?.length ? (
                <div className="d-flex justify-content-center mt-3">
                  <div className="btn-group">
                    {pager.links.map((l, idx) => {
                      const disabled = !l.url;
                      const active = !!l.active;
                      const nextPage = l.url ? Number(new URL(l.url).searchParams.get("page")) : null;

                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`btn btn-sm ${active ? "btn-dark" : "btn-outline-dark"}`}
                          disabled={disabled || loading || refreshing}
                          onClick={() => nextPage && load({ page: nextPage, mode: "refresh" })}
                          dangerouslySetInnerHTML={{ __html: decodeLabel(l.label) }}
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

      {showOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{t("activityLogs.show.title", "Log details")}</h5>
                  <button type="button" className="btn-close" onClick={closeShow} />
                </div>

                <div className="modal-body">
                  {showing ? (
                    <div className="row g-3">
                      <div className="col-12 col-lg-5">
                        <div className="border rounded-3 p-3 h-100">
                          <div className="d-flex flex-wrap gap-2 mb-3">
                            {showing?.action ? <span className="badge text-bg-dark">{showing.action}</span> : null}
                            {showing?.method ? (
                              <span className={`badge ${methodBadgeClass(showing.method)}`}>{showing.method}</span>
                            ) : null}
                            {showing?.status_code ? (
                              <span className={`badge ${statusBadgeClass(showing.status_code)}`}>{showing.status_code}</span>
                            ) : null}
                            {showing?.color ? <span className="badge text-bg-secondary">{showing.color}</span> : null}
                          </div>

                          <div className="d-flex flex-column gap-3">
                            {buildDetailFields(showing).map((item) => (
                              <div key={item.label}>
                                <div className="text-muted small mb-1">{item.label}</div>
                                <div className="text-break">{compactText(item.value)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="col-12 col-lg-7">
                        <div className="border rounded-3 p-3 h-100">
                          <div className="text-muted small mb-2">{t("activityLogs.show.metadata", "Metadata")}</div>
                          <PrettyJSON value={showing.metadata} />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeShow}>
                    {t("activityLogs.modal.close", "Close")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeShow} />
        </>
      )}

      {deleteOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{t("activityLogs.delete.title", "Confirm")}</h5>
                  <button type="button" className="btn-close" onClick={closeDelete} />
                </div>

                <div className="modal-body">
                  {deleteTarget ? (
                    <p className="mb-0">
                      {t("activityLogs.delete.message", "Delete this log")} <b>#{deleteTarget.id}</b> ?
                    </p>
                  ) : (
                    <p className="mb-0">{t("activityLogs.delete.message2", "Delete this log?")}</p>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeDelete} disabled={deleting}>
                    {t("activityLogs.modal.cancel", "Cancel")}
                  </button>

                  <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                    {deleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        {t("activityLogs.delete.deleting", "Deleting...")}
                      </>
                    ) : (
                      t("activityLogs.delete.btn", "Delete")
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeDelete} />
        </>
      )}

      {toast.open && (
        <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className={`toast show text-bg-${toast.type} border-0`}>
            <div className="d-flex">
              <div className="toast-body">{toast.message}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setToast((x) => ({ ...x, open: false }))}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
