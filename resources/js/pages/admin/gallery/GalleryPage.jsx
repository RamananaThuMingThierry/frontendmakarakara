import React, { useEffect, useMemo, useState } from "react";
import { galleryApi } from "../../../api/gallery";
import { imageUrl } from "../../../utils/Url";

const initialForm = {
  name: "",
  likes: 0,
  image_url: null,
};

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  const [showOpen, setShowOpen] = useState(false);
  const [showing, setShowing] = useState(null);
  const [showLoading, setShowLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
      const data = await galleryApi.list();
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      setItems(rows);
    } catch (e) {
      setError(e?.response?.data?.message || "Impossible de charger la galerie.");
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
      [item.name, item.likes, item.created_at]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [items, search]);

  function resetFormState() {
    setForm(initialForm);
    setErrors({});
    setGlobalError("");
    setImagePreview("");
  }

  function openCreate() {
    resetFormState();
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
    resetFormState();
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
    if (globalError) setGlobalError("");
  }

  function buildPayload() {
    const payload = new FormData();
    payload.append("name", form.name || "");
    payload.append("likes", String(form.likes ?? 0));

    if (form.image_url instanceof File) {
      payload.append("image_url", form.image_url);
    }

    return payload;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setGlobalError("");

    try {
      const result = await galleryApi.create(buildPayload());
      await load({ mode: "refresh" });
      setOpen(false);
      resetFormState();
      showToast("success", result.message || "Image ajoutee avec succes.");
    } catch (e2) {
      const data = e2?.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setGlobalError(data?.message || "Echec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function openShow(item) {
    setShowOpen(true);
    setShowLoading(true);
    setShowing(null);

    try {
      const data = await galleryApi.show(item.encrypted_id ?? item.id);
      setShowing(data);
    } catch (e) {
      showToast("danger", e?.response?.data?.message || "Impossible de charger l'image.");
      setShowOpen(false);
    } finally {
      setShowLoading(false);
    }
  }

  function closeShow() {
    if (showLoading) return;
    setShowOpen(false);
    setShowing(null);
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
      const result = await galleryApi.remove(deleteTarget.encrypted_id ?? deleteTarget.id);
      await load({ mode: "refresh" });
      if (showing?.id === deleteTarget.id) {
        setShowOpen(false);
        setShowing(null);
      }
      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", result.message || "Image supprimee.");
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
          <h4 className="mb-1">Gallery</h4>
          <div className="text-muted small">Gestion des images affichees dans la galerie du site.</div>
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

          <button className="btn btn-warning" onClick={openCreate} disabled={loading}>
            <i className="bi bi-plus-lg me-2" />
            Ajouter
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
            <div className="text-center text-muted py-4">Aucune image trouvee.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th style={{ width: 96 }}>Image</th>
                    <th>Nom</th>
                    <th style={{ width: 100 }}>Likes</th>
                    <th style={{ width: 180 }}>Ajoutee le</th>
                    <th className="text-end" style={{ width: 180 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <img
                          src={imageUrl(item.image_url)}
                          alt={item.name || `Gallery ${item.id}`}
                          style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 12 }}
                        />
                      </td>
                      <td className="fw-semibold">{item.name || "-"}</td>
                      <td>{item.likes ?? 0}</td>
                      <td>{item.created_at ? new Date(item.created_at).toLocaleString() : "-"}</td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => openShow(item)}>
                            <i className="bi bi-eye" />
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => askDelete(item)}>
                            <i className="bi bi-trash3" />
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

      {open && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Ajouter une image</h5>
                  <button type="button" className="btn-close" onClick={closeModal} disabled={saving} />
                </div>

                <form onSubmit={onSubmit}>
                  <div className="modal-body">
                    {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}

                    <div className="row g-3">
                      <div className="col-12 col-lg-5">
                        <label className="form-label">Image *</label>
                        <input
                          type="file"
                          accept="image/*"
                          className={`form-control ${errors.image_url ? "is-invalid" : ""}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            updateField("image_url", file);
                            setImagePreview(file ? URL.createObjectURL(file) : "");
                          }}
                        />
                        {errors.image_url ? <div className="invalid-feedback">{errors.image_url[0]}</div> : null}

                        <div className="mt-3">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="img-fluid rounded-3 border"
                              style={{ maxHeight: 260, objectFit: "cover" }}
                            />
                          ) : (
                            <div className="border rounded-3 p-5 text-center text-muted">Aucune image</div>
                          )}
                        </div>
                      </div>

                      <div className="col-12 col-lg-7">
                        <div className="row g-3">
                          <div className="col-12">
                            <label className="form-label">Nom</label>
                            <input
                              className={`form-control ${errors.name ? "is-invalid" : ""}`}
                              value={form.name}
                              onChange={(e) => updateField("name", e.target.value)}
                            />
                            {errors.name ? <div className="invalid-feedback">{errors.name[0]}</div> : null}
                          </div>

                          <div className="col-12 col-md-6">
                            <label className="form-label">Likes</label>
                            <input
                              type="number"
                              min="0"
                              className={`form-control ${errors.likes ? "is-invalid" : ""}`}
                              value={form.likes}
                              onChange={(e) => updateField("likes", e.target.value)}
                            />
                            {errors.likes ? <div className="invalid-feedback">{errors.likes[0]}</div> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>
                      Annuler
                    </button>
                    <button type="submit" className="btn btn-warning" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Enregistrement...
                        </>
                      ) : (
                        "Enregistrer"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeModal} />
        </>
      )}

      {showOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Detail de l'image</h5>
                  <button type="button" className="btn-close" onClick={closeShow} disabled={showLoading} />
                </div>

                <div className="modal-body">
                  {showLoading ? (
                    <div className="d-flex align-items-center gap-2 text-muted">
                      <span className="spinner-border spinner-border-sm" />
                      Chargement...
                    </div>
                  ) : showing ? (
                    <div className="row g-4">
                      <div className="col-12 col-lg-6">
                        <img
                          src={imageUrl(showing.image_url)}
                          alt={showing.name || `Gallery ${showing.id}`}
                          className="img-fluid rounded-3 border"
                        />
                      </div>

                      <div className="col-12 col-lg-6">
                        <div className="mb-3">
                          <div className="text-muted small">Nom</div>
                          <div className="fw-semibold">{showing.name || "-"}</div>
                        </div>
                        <div className="mb-3">
                          <div className="text-muted small">Likes</div>
                          <div>{showing.likes ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-muted small">Date d'ajout</div>
                          <div>{showing.created_at ? new Date(showing.created_at).toLocaleString() : "-"}</div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="modal-footer">
                  {showing ? (
                    <button
                      type="button"
                      className="btn btn-danger me-auto"
                      onClick={() => {
                        setShowOpen(false);
                        askDelete(showing);
                      }}
                    >
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
                  <p className="mb-0">
                    Supprimer l'image <b>{deleteTarget?.name || `#${deleteTarget?.id}`}</b> ?
                  </p>
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
