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

  // si metadata arrive en string JSON (au cas où)
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

function getActionStyle(actionRaw = "") {
  const a = String(actionRaw).toLowerCase();

  const failed = a.includes("failed") || a.includes("error");

  // prefix
  const isCreate = a.startsWith("create_");
  const isUpdate = a.startsWith("update_");
  const isDelete = a.startsWith("delete_") || a.startsWith("remove_");
  const isShow = a.startsWith("show_");
  const isView = a.startsWith("view_");

  // Bootstrap badge classes + icon + border color
  if (failed) {
    return { badge: "text-bg-danger", icon: "bi-x-octagon", border: "border-danger" };
  }
  if (isDelete) {
    return { badge: "text-bg-danger", icon: "bi-trash3", border: "border-danger" };
  }
  if (isUpdate) {
    return { badge: "text-bg-warning", icon: "bi-pencil-square", border: "border-warning" };
  }
  if (isCreate) {
    return { badge: "text-bg-success", icon: "bi-plus-circle", border: "border-success" };
  }
  if (isShow || isView) {
    return { badge: "text-bg-primary", icon: "bi-eye", border: "border-primary" };
  }

  // fallback
  return { badge: "text-bg-secondary", icon: "bi-activity", border: "border-secondary" };
}

export default function ActivityLogPage() {
  const { t } = useI18n();

  const [pager, setPager] = useState(null); // paginator laravel
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");

  // Toast (même pattern que Brands)
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  function showToast(type, message) {
    setToast({ open: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast((x) => ({ ...x, open: false })), 3500);
  }

  // Modal show
  const [showOpen, setShowOpen] = useState(false);
  const [showing, setShowing] = useState(null);

  // Modal delete
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
    return rows.filter((r) => {
      const user = r?.user?.name || r?.user?.email || "";
      return (
        String(r?.id ?? "").includes(s) ||
        String(r?.action ?? "").toLowerCase().includes(s) ||
        String(r?.entity_type ?? "").toLowerCase().includes(s) ||
        String(r?.entity_id ?? "").includes(s) ||
        String(user).toLowerCase().includes(s)
      );
    });
  }, [rows, q]);

  function openShow(row) {
    setShowing(row);
    setShowOpen(true);
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
      // recharge la page courante (si plus d'items, reculer page si besoin)
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
      {/* Header */}
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
            style={{ width: 300 }}
            placeholder={t("activityLogs.search", "Search (local)")}
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

      {/* Body */}
      <div className="card border-0 shadow-sm" style={{  backgroundColor: "#f6f6f6" }}>
        <div className="card-body">
          {err ? <div className="alert alert-danger">{err}</div> : null}

          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <span className="spinner-border spinner-border-sm" />
              {t("activityLogs.loading", "Loading...")}
            </div>
          ) : (
            <>
              {/* Cards grid */}
              {filtered.length === 0 ? (
                <div className="text-center text-muted py-4">{t("activityLogs.empty", "No logs found.")}</div>
              ) : (
                <div className="row g-3">
                  {filtered.map((r) => {
                    const userLabel =
                      r?.user?.name || r?.user?.email || (r?.user_id ? `#${r.user_id}` : "—");
                    const entity = r?.entity_type ? `${r.entity_type} #${r.entity_id ?? "—"}` : "—";

                    const s = getActionStyle(r.action);

                    return (
                      <div className="col-12 col-md-6 col-xl-4" key={r.id}>
                        <div className={`card h-100 border-0 ${s.border} shadow-sm`}>
                          <div className="card-body">
                            <div className="d-flex align-items-start justify-content-between gap-2">
                              <div>
                                <div className="text-muted small">
                                  {t("activityLogs.card.id", "Log")} #{r.id}
                                </div>
                              </div>

                              <div className="d-flex gap-2">
                                <div className="mt-1">
                                  <span className={`badge ${s.badge}`}>
                                    <i className={`bi ${s.icon} me-1`} />
                                    {r.action}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <hr />

                            <div className="mb-2">
                              <div className="text-muted small">{t("activityLogs.card.entity", "Entity")}</div>
                              <div className="fw-semibold">{entity}</div>
                            </div>

                            <div className="mb-2">
                              <div className="text-muted small">{t("activityLogs.card.user", "User")}</div>
                              <div>{userLabel}</div>
                            </div>

                            <div className="mb-0">
                              <div className="text-muted small">{t("activityLogs.card.date", "Date")}</div>
                              <div className="text-muted">{formatDate(r.created_at)}</div>
                            </div>
                          </div>

                          {/* Footer actions (optionnel) */}
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
              )}

              {/* Pagination */}
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

      {/* Modal show */}
      {showOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{t("activityLogs.show.title", "Log details")}</h5>
                  <button type="button" className="btn-close" onClick={closeShow} />
                </div>

                <div className="modal-body">
                  {showing ? (
                    <div className="row g-3">
                      <div className="col-12 col-lg-5">
                        <div className="border rounded-3 p-3">
                          <div className="text-muted small mb-1">{t("activityLogs.show.action", "Action")}</div>
                          <div className="fw-semibold">
                            <span className="badge text-bg-dark">{showing.action}</span>
                          </div>

                          <hr />

                          <div className="text-muted small mb-1">{t("activityLogs.show.entity", "Entity")}</div>
                          <div className="fw-semibold">
                            {showing?.entity_type ? `${showing.entity_type} #${showing?.entity_id ?? "—"}` : "—"}
                          </div>

                          <hr />

                          <div className="text-muted small mb-1">{t("activityLogs.show.user", "User")}</div>
                          <div>{showing?.user?.name || showing?.user?.email || (showing?.user_id ? `#${showing.user_id}` : "—")}</div>

                          <hr />

                          <div className="text-muted small mb-1">{t("activityLogs.show.date", "Date")}</div>
                          <div className="text-muted">{formatDate(showing.created_at)}</div>
                        </div>
                      </div>

                      <div className="col-12 col-lg-7">
                        <div className="border rounded-3 p-3">
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

      {/* Modal delete */}
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

      {/* Toast */}
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
