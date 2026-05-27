import React, { useEffect, useMemo, useState } from "react";
import { galleryApi } from "../../../api/gallery";
import TranslatedFileInput from "../../../Components/common/TranslatedFileInput";
import { useI18n } from "../../../hooks/website/I18nContext";
import { imageUrl } from "../../../utils/Url";

const initialForm = {
  name: "",
  likes: 0,
  image_url: null,
};

export default function GalleryPage() {
  const { lang, t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
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

  function formatDate(value) {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString(lang || "fr");
    } catch {
      return value;
    }
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
      setError(e?.response?.data?.message || t("gallery.error.load", "Unable to load the gallery."));
    } finally {
      if (mode === "initial") setLoading(false);
      else setRefreshing(false);
    }
  }

  useEffect(() => {
    load({ mode: "initial" });
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

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
    setEditing(null);
    setForm(initialForm);
    setErrors({});
    setGlobalError("");
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview("");
  }

  function openCreate() {
    resetFormState();
    setOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      name: item.name || "",
      likes: item.likes ?? 0,
      image_url: null,
    });
    setErrors({});
    setGlobalError("");
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview(item.image_url ? imageUrl(item.image_url) : "");
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
      const payload = buildPayload();
      const result = editing
        ? await galleryApi.update(editing.encrypted_id ?? editing.id, payload)
        : await galleryApi.create(payload);
      await load({ mode: "refresh" });
      setOpen(false);
      resetFormState();
      showToast(
        "success",
        result.message ||
          (editing
            ? t("gallery.toast.updated", "Image updated successfully.")
            : t("gallery.toast.created", "Image added successfully."))
      );
    } catch (e2) {
      const data = e2?.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setGlobalError(data?.message || t("gallery.toast.saveFailed", "Save failed."));
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
      showToast("danger", e?.response?.data?.message || t("gallery.error.show", "Unable to load the image."));
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
      showToast("success", result.message || t("gallery.toast.deleted", "Image deleted."));
    } catch (e) {
      showToast("danger", e?.response?.data?.message || t("gallery.toast.deleteFailed", "Delete failed."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">{t("gallery.title", "Gallery")}</h4>
          <div className="text-muted small">{t("gallery.subtitle", "Manage images displayed in the site gallery.")}</div>
        </div>

        <div className="d-flex gap-2">
          <input
            className="form-control"
            style={{ width: 300 }}
            placeholder={t("gallery.search", "Search...")}
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
                {t("gallery.refreshing", "Refreshing...")}
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2" />
                {t("gallery.refresh", "Refresh")}
              </>
            )}
          </button>

          <button className="btn btn-warning" onClick={openCreate} disabled={loading}>
            <i className="bi bi-plus-lg me-2" />
            {t("gallery.new", "Add image")}
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {error ? <div className="alert alert-danger">{error}</div> : null}

          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <span className="spinner-border spinner-border-sm" />
              {t("gallery.loading", "Loading...")}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted py-4">{t("gallery.empty", "No images found.")}</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th style={{ width: 96 }}>{t("gallery.table.image", "Image")}</th>
                    <th>{t("gallery.table.name", "Name")}</th>
                    <th style={{ width: 100 }}>{t("gallery.table.likes", "Likes")}</th>
                    <th style={{ width: 180 }}>{t("gallery.table.createdAt", "Added on")}</th>
                    <th className="text-end" style={{ width: 180 }}>
                      {t("gallery.table.actions", "Actions")}
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
                      <td>{formatDate(item.created_at)}</td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => openShow(item)} title={t("gallery.actions.view", "View")}>
                            <i className="bi bi-eye" />
                          </button>
                          <button className="btn btn-sm btn-outline-dark" onClick={() => openEdit(item)} title={t("gallery.actions.edit", "Edit")}>
                            <i className="bi bi-pencil-square" />
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => askDelete(item)} title={t("gallery.actions.delete", "Delete")}>
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
                  <h5 className="modal-title">
                    {editing ? t("gallery.modal.editTitle", "Edit image") : t("gallery.modal.createTitle", "Add image")}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal} disabled={saving} />
                </div>

                <form onSubmit={onSubmit}>
                  <div className="modal-body">
                    {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}

                    <div className="row g-3">
                      <div className="col-12 col-lg-5">
                        <label className="form-label">
                          {t("gallery.modal.image", "Image")} {editing ? null : "*"}
                        </label>
                        <TranslatedFileInput
                          accept="image/*"
                          error={errors.image_url?.[0] || ""}
                          selectedText={form.image_url?.name || ""}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            updateField("image_url", file);
                            if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
                            setImagePreview(file ? URL.createObjectURL(file) : "");
                          }}
                        />

                        <div className="mt-3">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt={t("gallery.modal.preview", "Preview")}
                              className="img-fluid rounded-3 border"
                              style={{ maxHeight: 260, objectFit: "cover" }}
                            />
                          ) : (
                            <div className="border rounded-3 p-5 text-center text-muted">{t("gallery.modal.noImage", "No image")}</div>
                          )}
                        </div>
                      </div>

                      <div className="col-12 col-lg-7">
                        <div className="row g-3">
                          <div className="col-12">
                            <label className="form-label">{t("gallery.modal.name", "Name")}</label>
                            <input
                              className={`form-control ${errors.name ? "is-invalid" : ""}`}
                              value={form.name}
                              onChange={(e) => updateField("name", e.target.value)}
                            />
                            {errors.name ? <div className="invalid-feedback">{errors.name[0]}</div> : null}
                          </div>

                          <div className="col-12 col-md-6">
                            <label className="form-label">{t("gallery.modal.likes", "Likes")}</label>
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
                      {t("gallery.modal.cancel", "Cancel")}
                    </button>
                    <button type="submit" className="btn btn-warning" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          {t("gallery.modal.saving", "Saving...")}
                        </>
                      ) : (
                        editing ? t("gallery.modal.update", "Update") : t("gallery.modal.save", "Save")
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
                  <h5 className="modal-title">{t("gallery.show.title", "Image details")}</h5>
                  <button type="button" className="btn-close" onClick={closeShow} disabled={showLoading} />
                </div>

                <div className="modal-body">
                  {showLoading ? (
                    <div className="d-flex align-items-center gap-2 text-muted">
                      <span className="spinner-border spinner-border-sm" />
                      {t("gallery.loading", "Loading...")}
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
                          <div className="text-muted small">{t("gallery.show.name", "Name")}</div>
                          <div className="fw-semibold">{showing.name || "-"}</div>
                        </div>
                        <div className="mb-3">
                          <div className="text-muted small">{t("gallery.show.likes", "Likes")}</div>
                          <div>{showing.likes ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-muted small">{t("gallery.show.createdAt", "Added on")}</div>
                          <div>{formatDate(showing.created_at)}</div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="modal-footer">
                  {showing ? (
                    <button
                      type="button"
                      className="btn btn-outline-dark me-2"
                      onClick={() => {
                        const item = showing;
                        setShowOpen(false);
                        setShowing(null);
                        openEdit(item);
                      }}
                    >
                      <i className="bi bi-pencil-square me-2" />
                      {t("gallery.actions.edit", "Edit")}
                    </button>
                  ) : null}
                  {showing ? (
                    <button
                      type="button"
                      className="btn btn-danger me-auto"
                      onClick={() => {
                        setShowOpen(false);
                        askDelete(showing);
                      }}
                    >
                      {t("gallery.actions.delete", "Delete")}
                    </button>
                  ) : null}
                  <button type="button" className="btn btn-outline-secondary" onClick={closeShow} disabled={showLoading}>
                    {t("gallery.actions.close", "Close")}
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
                  <h5 className="modal-title">{t("gallery.delete.title", "Confirmation")}</h5>
                  <button type="button" className="btn-close" onClick={closeDelete} disabled={deleting} />
                </div>
                <div className="modal-body">
                  <p className="mb-0">
                    {t("gallery.delete.message", "Delete image")}{" "}
                    <b>{deleteTarget?.name || `#${deleteTarget?.id}`}</b> ?
                  </p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeDelete} disabled={deleting}>
                    {t("gallery.modal.cancel", "Cancel")}
                  </button>
                  <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                    {deleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        {t("gallery.delete.deleting", "Deleting...")}
                      </>
                    ) : (
                      t("gallery.actions.delete", "Delete")
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
