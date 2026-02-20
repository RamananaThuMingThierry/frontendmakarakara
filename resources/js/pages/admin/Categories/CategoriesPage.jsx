import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { categoriesApi } from "../../../api/categories";
import { useI18n } from "../../../hooks/website/I18nContext";

export default function CategoriesPage() {
  const { t } = useI18n();

  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

  // modal create/edit
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [form, setForm] = useState({ name: "", slug: "", parent_id: "", is_active: true });

  // delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function showToast(type, message) {
    setToast({ open: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast((x) => ({ ...x, open: false })), 3500);
  }

  async function load({ mode = "refresh" } = {}) {
    if (mode === "initial") setInitialLoading(true);
    else setRefreshing(true);

    try {
      const res = await categoriesApi.list();
      const list = Array.isArray(res) ? res : res?.data ?? [];
      setItems(list);
    } catch (e) {
      showToast("danger", e?.response?.data?.message || t("categories.toast.loadFailed", "Load failed"));
    } finally {
      if (mode === "initial") setInitialLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load({ mode: "initial" });
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", slug: "", parent_id: "", is_active: true });
    setErrors({});
    setGlobalError("");
    setOpen(true);
  }

  function openEdit(cat) {
    setEditing(cat);
    setForm({
      name: cat.name ?? "",
      slug: cat.slug ?? "",
      parent_id: cat.parent_id ?? "",
      is_active: !!cat.is_active,
    });
    setErrors({});
    setGlobalError("");
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
  }

  function onDeleteAsk(cat) {
    setDeleteTarget(cat);
    setDeleteOpen(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  function onView(encrypted_id) {
    navigate(`/admin/categories/${encrypted_id}`);
  }

  // options parent (si tu veux toujours parent dans modal)
  const parentOptions = useMemo(() => {
    return items.map((c) => ({ id: c.id, label: c.name }));
  }, [items]);

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    if (!form.name.trim()) {
      setErrors({ name: [t("categories.toast.nameRequired", "Name is required")] });
      return;
    }

    const payload = { ...form, parent_id: form.parent_id ? form.parent_id : null };

    setSaving(true);
    try {
      if (editing) await categoriesApi.update(editing.id, payload);
      else await categoriesApi.create(payload);

      await load({ mode: "refresh" });
      setOpen(false);

      showToast(
        "success",
        editing ? t("categories.toast.updated", "Updated.") : t("categories.toast.created", "Created.")
      );
    } catch (e2) {
      const data = e2?.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setGlobalError(data?.message || t("categories.toast.saveFailed", "Save failed"));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    try {
      // si ton API delete attend encrypted_id, remplace par deleteTarget.encrypted_id
      await categoriesApi.remove(deleteTarget.id);

      await load({ mode: "refresh" });

      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", t("categories.toast.deleted", "Deleted."));
    } catch (e) {
      const msg = e?.response?.data?.message || t("categories.toast.deleteFailed", "Delete failed.");
      showToast("danger", msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">{t("categories.title", "Categories")}</h4>
          <div className="text-muted small">{t("categories.subtitle", "Manage categories")}</div>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => load({ mode: "refresh" })}
            disabled={initialLoading || refreshing}
          >
            {initialLoading || refreshing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                {t("categories.refreshing", "Refreshing...")}
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2" />
                {t("categories.refresh", "Refresh")}
              </>
            )}
          </button>

          <button className="btn btn-warning" onClick={openCreate} disabled={initialLoading}>
            <i className="bi bi-plus-lg me-2" />
            {t("categories.new", "New category")}
          </button>
        </div>
      </div>

      {initialLoading ? (
        <div className="d-flex align-items-center gap-2 text-muted mb-3">
          <div className="spinner-border spinner-border-sm" />
          {t("categories.loading", "Loading...")}
        </div>
      ) : null}

      {/* Cards */}
      <div className="row g-3">
        {items.length === 0 && !initialLoading ? (
          <div className="col-12">
            <div className="alert alert-light border">
              {t("categories.empty", "No categories found.")}
            </div>
          </div>
        ) : null}

        {items.map((cat) => (
          <div className="col-12 col-md-6 col-xl-4" key={cat.encrypted_id}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <h5 className="mb-1">{cat.name}</h5>
                    <div className="text-muted small">
                      <span className="me-2">
                        <i className="bi bi-link-45deg me-1" />
                        {cat.slug || "-"}
                      </span>
                    </div>
                  </div>

                  <div>
                    {cat.is_active ? (
                      <span className="badge text-bg-success">{t("categories.active", "Active")}</span>
                    ) : (
                      <span className="badge text-bg-secondary">{t("categories.inactive", "Inactive")}</span>
                    )}
                  </div>
                </div>

                <hr className="my-3" />

                <div className="d-flex flex-wrap gap-2">
                  <span className="badge text-bg-light border">
                    {t("categories.subcats", "Sub-categories")}:{" "}
                    <b>{Number(cat.subcategories_total ?? 0)}</b>
                  </span>

                  <span className="badge text-bg-light border">
                    {t("categories.products", "Products")}:{" "}
                    <b>{Number(cat.products_total ?? 0)}</b>
                  </span>
                </div>

                {/* Actions */}
                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => onView(cat.encrypted_id)}>
                    <i className="bi bi-eye me-1" />
                    {t("categories.btn.view", "Gérer")}
                  </button>

                  <button className="btn btn-sm btn-outline-dark" onClick={() => openEdit(cat.encrypted_id)}>
                    <i className="bi bi-pencil-square me-1" />
                    {t("categories.btn.edit", "Modifier")}
                  </button>

                  <button className="btn btn-sm btn-outline-danger" onClick={() => onDeleteAsk(cat.encrypted_id)}>
                    <i className="bi bi-trash3 me-1" />
                    {t("categories.btn.delete", "Supprimer")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal create/edit */}
      {open && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editing ? t("categories.modal.editTitle", "Edit") : t("categories.modal.createTitle", "Create")}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>

                <form onSubmit={onSubmit}>
                  <div className="modal-body">
                    {globalError && <div className="alert alert-danger py-2">{globalError}</div>}

                    <div className="mb-3">
                      <label className="form-label">{t("categories.modal.name", "Name")}</label>
                      <input
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder={t("categories.modal.placeholderName", "Ex: Shoes")}
                        autoFocus
                      />
                      {errors.name && <span className="text-danger small">{errors.name[0]}</span>}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">{t("categories.modal.slug", "Slug")}</label>
                      <input
                        className="form-control"
                        value={form.slug}
                        onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                        placeholder={t("categories.modal.placeholderSlug", "Ex: shoes")}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">{t("categories.modal.parent", "Parent")}</label>
                      <select
                        className="form-select"
                        value={form.parent_id ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value }))}
                      >
                        <option value="">{t("categories.modal.noParent", "No parent")}</option>
                        {parentOptions
                          .filter((c) => !editing || c.id !== editing.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="active"
                        checked={!!form.is_active}
                        onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                      />
                      <label className="form-check-label" htmlFor="active">
                        {t("categories.modal.active", "Active")}
                      </label>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>
                      {t("categories.modal.cancel", "Cancel")}
                    </button>
                    <button className="btn btn-warning" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          {t("categories.modal.saving", "Saving...")}
                        </>
                      ) : (
                        t("categories.modal.save", "Save")
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

      {/* Modal delete */}
      {deleteOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{t("categories.delete.title", "Confirm")}</h5>
                  <button type="button" className="btn-close" onClick={closeDeleteModal} />
                </div>

                <div className="modal-body">
                  {deleteTarget ? (
                    <p className="mb-0">
                      {t("categories.delete.message", "Delete category")} <b>{deleteTarget.name}</b> ?
                    </p>
                  ) : (
                    <p className="mb-0">{t("categories.delete.message2", "Delete this category?")}</p>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeDeleteModal} disabled={deleting}>
                    {t("categories.modal.cancel", "Cancel")}
                  </button>

                  <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                    {deleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        {t("categories.delete.deleting", "Deleting...")}
                      </>
                    ) : (
                      t("categories.delete.btn", "Delete")
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeDeleteModal} />
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