import React, { useEffect, useMemo, useState } from "react";
import { contactsApi } from "../../../api/contacts";

function formatDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value || "-";
  }
}

export default function ContactUsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  const [showOpen, setShowOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function showToast(type, message) {
    setToast({ open: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 3500);
  }

  async function load({ mode = "initial" } = {}) {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);

    setError("");
    try {
      const data = await contactsApi.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Impossible de charger les messages de contact.");
    } finally {
      if (mode === "initial") setLoading(false);
      else setRefreshing(false);
    }
  }

  useEffect(() => {
    load({ mode: "initial" });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) =>
      [item.id, item.name, item.email, item.phone, item.subject, item.message]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [items, search]);

  async function openShow(item) {
    setShowOpen(true);
    setShowLoading(true);
    setSelected(null);

    try {
      const data = await contactsApi.show(item.encrypted_id ?? item.id);
      setSelected(data);
    } catch (e) {
      showToast("danger", e?.response?.data?.message || "Impossible de charger le message.");
      setShowOpen(false);
    } finally {
      setShowLoading(false);
    }
  }

  function closeShow() {
    if (showLoading) return;
    setShowOpen(false);
    setSelected(null);
  }

  function askDelete(item) {
    setDeleteTarget(item);
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
      const result = await contactsApi.remove(deleteTarget.encrypted_id ?? deleteTarget.id);
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteOpen(false);
      setDeleteTarget(null);

      if (selected?.id === deleteTarget.id) {
        setShowOpen(false);
        setSelected(null);
      }

      showToast("success", result.message || "Message supprime avec succes.");
    } catch (e) {
      showToast("danger", e?.response?.data?.message || "Echec de la suppression.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">Messages de contact</h4>
          <div className="text-muted small">Liste, consultation et suppression des demandes.</div>
          <div className="text-muted small">Total: {items.length}</div>
        </div>

        <div className="d-flex gap-2">
          <input
            className="form-control"
            style={{ width: 300 }}
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
          />

          <button
            className="btn btn-outline-secondary"
            onClick={() => load({ mode: "refresh" })}
            disabled={loading || refreshing}
          >
            {loading || refreshing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Actualisation...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2" />
                Actualiser
              </>
            )}
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {error ? <div className="alert alert-danger">{error}</div> : null}

          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <span className="spinner-border spinner-border-sm" />
              Chargement...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted py-4">Aucun message trouve.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th style={{ width: 70 }}>#</th>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Telephone</th>
                    <th>Sujet</th>
                    <th>Date</th>
                    <th className="text-end" style={{ width: 200 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td className="fw-semibold">{item.name || "-"}</td>
                      <td>{item.email || "-"}</td>
                      <td>{item.phone || "-"}</td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: 220 }}>
                          {item.subject || "-"}
                        </div>
                      </td>
                      <td>{formatDate(item.created_at)}</td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openShow(item)}
                          >
                            <i className="bi bi-eye me-1" />
                            Voir
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => askDelete(item)}
                          >
                            <i className="bi bi-trash3 me-1" />
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Detail du message</h5>
                  <button type="button" className="btn-close" onClick={closeShow} disabled={showLoading} />
                </div>

                <div className="modal-body">
                  {showLoading ? (
                    <div className="d-flex align-items-center gap-2 text-muted">
                      <span className="spinner-border spinner-border-sm" />
                      Chargement du detail...
                    </div>
                  ) : selected ? (
                    <div className="row g-3">
                      <div className="col-12 col-lg-5">
                        <div className="border rounded-3 p-3 h-100">
                          <div className="text-muted small mb-1">Nom</div>
                          <div className="fw-semibold">{selected.name || "-"}</div>

                          <hr />

                          <div className="text-muted small mb-1">Email</div>
                          <div>{selected.email || "-"}</div>

                          <hr />

                          <div className="text-muted small mb-1">Telephone</div>
                          <div>{selected.phone || "-"}</div>

                          <hr />

                          <div className="text-muted small mb-1">Sujet</div>
                          <div>{selected.subject || "-"}</div>

                          <hr />

                          <div className="text-muted small mb-1">Date</div>
                          <div>{formatDate(selected.created_at)}</div>
                        </div>
                      </div>

                      <div className="col-12 col-lg-7">
                        <div className="border rounded-3 p-3 h-100">
                          <div className="text-muted small mb-2">Message</div>
                          <div className="bg-light rounded-3 p-3" style={{ whiteSpace: "pre-wrap" }}>
                            {selected.message || "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted">Aucun detail disponible.</div>
                  )}
                </div>

                <div className="modal-footer">
                  {selected ? (
                    <button
                      type="button"
                      className="btn btn-danger me-auto"
                      onClick={() => {
                        setShowOpen(false);
                        askDelete(selected);
                      }}
                    >
                      <i className="bi bi-trash3 me-2" />
                      Supprimer
                    </button>
                  ) : null}

                  <button type="button" className="btn btn-outline-secondary" onClick={closeShow} disabled={showLoading}>
                    Fermer
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
                  <h5 className="modal-title">Confirmation</h5>
                  <button type="button" className="btn-close" onClick={closeDelete} disabled={deleting} />
                </div>

                <div className="modal-body">
                  {deleteTarget ? (
                    <p className="mb-0">
                      Supprimer le message de <b>{deleteTarget.name}</b> ?
                    </p>
                  ) : (
                    <p className="mb-0">Supprimer ce message ?</p>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeDelete} disabled={deleting}>
                    Annuler
                  </button>
                  <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                    {deleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Suppression...
                      </>
                    ) : (
                      "Supprimer"
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
                onClick={() => setToast((current) => ({ ...current, open: false }))}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
