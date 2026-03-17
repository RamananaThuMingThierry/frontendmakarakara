import React, { useEffect, useMemo, useState } from "react";
import { testimonialsApi } from "../../../api/testimonials";

function buildImageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const apiUrl = import.meta.env.VITE_API_URL || "http://192.168.0.17:8000/api";
  const base = apiUrl.replace(/\/api\/?$/, "");
  return `${base}/${String(path).replace(/^\/+/, "")}`;
}

const initialForm = {
  name: "",
  city: "",
  product_used: "",
  rating: "",
  message: "",
  position: 0,
  is_active: true,
  photo_url: null,
};

export default function TestimonialPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");

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
      const data = await testimonialsApi.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Impossible de charger les testimonials.");
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
      [item.name, item.city, item.product_used, item.rating, item.message]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [items, search]);

  function resetFormState() {
    setForm(initialForm);
    setErrors({});
    setGlobalError("");
    setPhotoPreview("");
  }

  function openCreate() {
    setEditing(null);
    resetFormState();
    setOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setErrors({});
    setGlobalError("");
    setForm({
      name: item.name ?? "",
      city: item.city ?? "",
      product_used: item.product_used ?? "",
      rating: item.rating ?? "",
      message: item.message ?? "",
      position: item.position ?? 0,
      is_active: Boolean(item.is_active),
      photo_url: null,
    });
    setPhotoPreview(buildImageUrl(item.photo_url));
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
    setEditing(null);
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
    payload.append("name", form.name);
    payload.append("city", form.city || "");
    payload.append("product_used", form.product_used || "");
    payload.append("rating", form.rating === "" ? "" : String(form.rating));
    payload.append("message", form.message);
    payload.append("position", String(form.position ?? 0));
    payload.append("is_active", form.is_active ? "1" : "0");

    if (form.photo_url instanceof File) {
      payload.append("photo_url", form.photo_url);
    }

    return payload;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setGlobalError("");

    try {
      const payload = buildPayload();
      const result = editing
        ? await testimonialsApi.update(editing.encrypted_id ?? editing.id, payload)
        : await testimonialsApi.create(payload);

      await load({ mode: "refresh" });
      setOpen(false);
      setEditing(null);
      resetFormState();
      showToast("success", result.message || (editing ? "Testimonial mis a jour." : "Testimonial cree."));
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
      const data = await testimonialsApi.show(item.encrypted_id ?? item.id);
      setShowing(data);
    } catch (e) {
      showToast("danger", e?.response?.data?.message || "Impossible de charger le testimonial.");
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
      const result = await testimonialsApi.remove(deleteTarget.encrypted_id ?? deleteTarget.id);
      await load({ mode: "refresh" });
      if (showing?.id === deleteTarget.id) {
        setShowOpen(false);
        setShowing(null);
      }
      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", result.message || "Testimonial supprime.");
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
          <h4 className="mb-1">Testimonials</h4>
          <div className="text-muted small">Gestion des avis clients affiches sur le site.</div>
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
            Nouveau testimonial
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
            <div className="text-center text-muted py-4">Aucun testimonial trouve.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th style={{ width: 90 }}>Photo</th>
                    <th>Nom</th>
                    <th>Ville</th>
                    <th>Produit</th>
                    <th>Note</th>
                    <th>Position</th>
                    <th>Statut</th>
                    <th className="text-end" style={{ width: 240 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.photo_url ? (
                          <img
                            src={buildImageUrl(item.photo_url)}
                            alt={item.name}
                            style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 12 }}
                          />
                        ) : (
                          <div
                            className="bg-light text-muted d-inline-flex align-items-center justify-content-center"
                            style={{ width: 52, height: 52, borderRadius: 12 }}
                          >
                            <i className="bi bi-person" />
                          </div>
                        )}
                      </td>
                      <td className="fw-semibold">{item.name}</td>
                      <td>{item.city || "-"}</td>
                      <td>{item.product_used || "-"}</td>
                      <td>{item.rating ? `${item.rating}/5` : "-"}</td>
                      <td>{item.position ?? 0}</td>
                      <td>
                        <span className={`badge ${item.is_active ? "text-bg-success" : "text-bg-secondary"}`}>
                          {item.is_active ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => openShow(item)}>
                            <i className="bi bi-eye" />
                          </button>
                          <button className="btn btn-sm btn-outline-dark" onClick={() => openEdit(item)}>
                            <i className="bi bi-pencil-square" />
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
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{editing ? "Modifier le testimonial" : "Nouveau testimonial"}</h5>
                  <button type="button" className="btn-close" onClick={closeModal} disabled={saving} />
                </div>

                <form onSubmit={onSubmit}>
                  <div className="modal-body">
                    {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}

                    <div className="row g-3">
                      <div className="col-12 col-lg-4">
                        <label className="form-label">Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          className={`form-control ${errors.photo_url ? "is-invalid" : ""}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            updateField("photo_url", file);
                            setPhotoPreview(file ? URL.createObjectURL(file) : editing ? buildImageUrl(editing.photo_url) : "");
                          }}
                        />
                        {errors.photo_url ? <div className="invalid-feedback">{errors.photo_url[0]}</div> : null}

                        <div className="mt-3">
                          {photoPreview ? (
                            <img
                              src={photoPreview}
                              alt="Preview"
                              className="img-fluid rounded-3 border"
                              style={{ maxHeight: 240, objectFit: "cover" }}
                            />
                          ) : (
                            <div className="border rounded-3 p-4 text-center text-muted">Aucune image</div>
                          )}
                        </div>
                      </div>

                      <div className="col-12 col-lg-8">
                        <div className="row g-3">
                          <div className="col-12 col-md-6">
                            <label className="form-label">Nom *</label>
                            <input
                              className={`form-control ${errors.name ? "is-invalid" : ""}`}
                              value={form.name}
                              onChange={(e) => updateField("name", e.target.value)}
                            />
                            {errors.name ? <div className="invalid-feedback">{errors.name[0]}</div> : null}
                          </div>

                          <div className="col-12 col-md-6">
                            <label className="form-label">Ville</label>
                            <input
                              className={`form-control ${errors.city ? "is-invalid" : ""}`}
                              value={form.city}
                              onChange={(e) => updateField("city", e.target.value)}
                            />
                            {errors.city ? <div className="invalid-feedback">{errors.city[0]}</div> : null}
                          </div>

                          <div className="col-12 col-md-6">
                            <label className="form-label">Produit utilise</label>
                            <input
                              className={`form-control ${errors.product_used ? "is-invalid" : ""}`}
                              value={form.product_used}
                              onChange={(e) => updateField("product_used", e.target.value)}
                            />
                            {errors.product_used ? (
                              <div className="invalid-feedback">{errors.product_used[0]}</div>
                            ) : null}
                          </div>

                          <div className="col-12 col-md-3">
                            <label className="form-label">Note</label>
                            <select
                              className={`form-select ${errors.rating ? "is-invalid" : ""}`}
                              value={form.rating}
                              onChange={(e) => updateField("rating", e.target.value)}
                            >
                              <option value="">Aucune</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                            </select>
                            {errors.rating ? <div className="invalid-feedback">{errors.rating[0]}</div> : null}
                          </div>

                          <div className="col-12 col-md-3">
                            <label className="form-label">Position</label>
                            <input
                              type="number"
                              min="0"
                              className={`form-control ${errors.position ? "is-invalid" : ""}`}
                              value={form.position}
                              onChange={(e) => updateField("position", e.target.value)}
                            />
                            {errors.position ? <div className="invalid-feedback">{errors.position[0]}</div> : null}
                          </div>

                          <div className="col-12">
                            <label className="form-label">Message *</label>
                            <textarea
                              rows={6}
                              className={`form-control ${errors.message ? "is-invalid" : ""}`}
                              value={form.message}
                              onChange={(e) => updateField("message", e.target.value)}
                            />
                            {errors.message ? <div className="invalid-feedback">{errors.message[0]}</div> : null}
                          </div>

                          <div className="col-12">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="testimonial-active"
                                checked={form.is_active}
                                onChange={(e) => updateField("is_active", e.target.checked)}
                              />
                              <label className="form-check-label" htmlFor="testimonial-active">
                                Visible sur le site
                              </label>
                            </div>
                            {errors.is_active ? <div className="text-danger small mt-1">{errors.is_active[0]}</div> : null}
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
                  <h5 className="modal-title">Detail du testimonial</h5>
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
                      <div className="col-12 col-lg-4">
                        {showing.photo_url ? (
                          <img
                            src={buildImageUrl(showing.photo_url)}
                            alt={showing.name}
                            className="img-fluid rounded-3 border"
                          />
                        ) : (
                          <div className="border rounded-3 p-5 text-center text-muted">Aucune image</div>
                        )}
                      </div>

                      <div className="col-12 col-lg-8">
                        <div className="mb-3">
                          <div className="text-muted small">Nom</div>
                          <div className="fw-semibold">{showing.name}</div>
                        </div>
                        <div className="row g-3 mb-3">
                          <div className="col-6">
                            <div className="text-muted small">Ville</div>
                            <div>{showing.city || "-"}</div>
                          </div>
                          <div className="col-6">
                            <div className="text-muted small">Produit</div>
                            <div>{showing.product_used || "-"}</div>
                          </div>
                          <div className="col-6">
                            <div className="text-muted small">Note</div>
                            <div>{showing.rating ? `${showing.rating}/5` : "-"}</div>
                          </div>
                          <div className="col-6">
                            <div className="text-muted small">Statut</div>
                            <div>{showing.is_active ? "Actif" : "Inactif"}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-muted small mb-2">Message</div>
                          <div className="bg-light rounded-3 p-3" style={{ whiteSpace: "pre-wrap" }}>
                            {showing.message || "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="modal-footer">
                  {showing ? (
                    <button
                      type="button"
                      className="btn btn-dark me-auto"
                      onClick={() => {
                        setShowOpen(false);
                        openEdit(showing);
                      }}
                    >
                      Modifier
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
                    Supprimer le testimonial de <b>{deleteTarget?.name}</b> ?
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
