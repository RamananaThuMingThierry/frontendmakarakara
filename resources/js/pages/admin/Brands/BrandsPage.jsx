import React, { useEffect, useMemo, useRef, useState } from "react";
import { brandsApi } from "../../../api/brands";
import { useI18n } from "../../../hooks/website/I18nContext";

import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

export default function BrandsPage() {
  const { lang, t } = useI18n();

  const DT_LANG_URL = useMemo(() => `/lang/datatables/${lang}.json`, [lang]);

  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

  function showToast(type, message) {
    setToast({ open: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast((x) => ({ ...x, open: false })), 3500);
  }

  // Modal create/edit
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");

  // Modal delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Modal show
  const [showOpen, setShowOpen] = useState(false);
  const [showing, setShowing] = useState(null);

  // Upload file + preview
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  // Form
  const [form, setForm] = useState({
    name: "",
    logo: "",
    description: "",
    is_active: true,
  });

  const tableRef = useRef(null);
  const dtRef = useRef(null);

  // items ref pour handlers jquery
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  const logoUrl = (logo) => {
    if (!logo) return "";
    const s = String(logo).trim();
    if (s.startsWith("http")) return s;
    if (s.startsWith("/")) return s;
    return `/${s}`;
  };

  async function load({ mode = "refresh" } = {}) {
    if (mode === "initial") setInitialLoading(true);
    else setRefreshing(true);

    try {
      const list = await brandsApi.list();
      setItems(Array.isArray(list) ? list : []);
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
    setForm({ name: "", logo: "", description: "", is_active: true });
    setErrors({});
    setGlobalError("");
    setLogoFile(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview("");
    setOpen(true);
  }

  function openEdit(brand) {
    setEditing(brand);
    setForm({
      name: brand?.name ?? "",
      logo: brand?.logo ?? "",
      description: brand?.description ?? "",
      is_active: !!brand?.is_active,
    });
    setErrors({});
    setGlobalError("");
    setLogoFile(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview("");
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
  }

  function onDeleteAsk(brand) {
    setDeleteTarget(brand);
    setDeleteOpen(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  function openShow(brand) {
    setShowing(brand);
    setShowOpen(true);
  }

  function closeShow() {
    setShowOpen(false);
    setShowing(null);
  }

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);


  // ✅ (Re)Init DataTable quand langue change (après initialLoading)
  useEffect(() => {
    if (initialLoading) return;
    if (!tableRef.current) return;

    const $table = $(tableRef.current);

    // destroy si existe
    if (dtRef.current) {
      try {
        $table.off("click", ".js-show");
        $table.off("click", ".js-edit");
        $table.off("click", ".js-del");
      } catch {}
      dtRef.current.destroy();
      dtRef.current = null;
      $table.find("tbody").empty();
    }

    dtRef.current = $table.DataTable({
      data: itemsRef.current,
      pageLength: 10,
      lengthMenu: [10, 15, 25, 50, 100],
      ordering: true,
      searching: true,
      responsive: true,
      language: { url: DT_LANG_URL },
      columns: [
        {
          data: "logo",
          orderable: false,
          width: 90,
          render: (v) => {
            const src = logoUrl(v);
            if (!src) return `<span class="text-muted small">—</span>`;
            return `
              <div class="d-flex align-items-center gap-2">
                <img src="${src}" alt="logo"
                  style="width:34px;height:34px;object-fit:contain;border-radius:6px;border:1px solid rgba(0,0,0,.08)" />
              </div>
            `;
          },
        },
        { data: "name", defaultContent: "" },
        { data: "slug", defaultContent: "" },
        {
          data: "is_active",
          width: 120,
          render: (v) =>
            v
              ? `<span class="badge text-bg-success">Active</span>`
              : `<span class="badge text-bg-secondary">Inactive</span>`,
        },
        {
          data: "description",
          defaultContent: "",
          render: (v) => {
            const s = (v ?? "").toString();
            const safe = s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            return safe ? `<span class="text-muted">${safe}</span>` : `<span class="text-muted small">—</span>`;
          },
        },
        {
          data: null,
          orderable: false,
          className: "text-end",
          width: 180,
          render: (d, tt, row) => {
            const id = getRowId(row);
            return `
              <button class="btn btn-sm btn-outline-primary me-2 js-show" data-id="${id}">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-outline-dark me-2 js-edit" data-id="${id}">
                <i class="bi bi-pencil-square"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger js-del" data-id="${id}">
                <i class="bi bi-trash3"></i>
              </button>
            `;
          },
        },
      ],
    });


    $table.on("click", ".js-show", (e) => {
      const id = $(e.currentTarget).data("id");
      const brand = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (brand) openShow(brand);
    });


    // handlers
    $table.on("click", ".js-edit", (e) => {
      const id = $(e.currentTarget).data("id");
      const brand = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (brand) openEdit(brand);
    });

    $table.on("click", ".js-del", (e) => {
      const id = $(e.currentTarget).data("id");
      const brand = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (brand) onDeleteAsk(brand);
    });

    return () => {
      try {
        $table.off("click", ".js-edit");
        $table.off("click", ".js-del");
      } catch {}
      dtRef.current?.destroy();
      dtRef.current = null;
    };
  }, [initialLoading, DT_LANG_URL]);

  // ✅ Update rows quand items change
  useEffect(() => {
    if (!dtRef.current) return;
    const dt = dtRef.current;

    const page = dt.page();
    const search = dt.search();
    const order = dt.order();

    dt.clear();
    dt.rows.add(items);
    dt.draw(false);

    dt.order(order).draw(false);
    dt.search(search).draw(false);
    dt.page(page).draw(false);
  }, [items]);

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    if (!form.name.trim()) {
      setErrors({ name: [t("brands.toast.nameRequired", "Name is required")] });
      return;
    }

    const fd = new FormData();
    fd.append("name", form.name?.trim());
    fd.append("description", form.description?.trim() || "");
    fd.append("is_active", form.is_active ? "1" : "0");

    if (logoFile) fd.append("logo", logoFile);

    // si editing et backend attend PUT :
    if (editing) fd.append("_method", "PUT");

    setSaving(true);
    try {
      if (editing) {
        await brandsApi.update(getRowId(editing), fd); 
      } else {
        await brandsApi.create(fd); 
      }

      await load({ mode: "refresh" });
      setOpen(false);

      showToast(
        "success",
        editing ? t("brands.toast.updated", "Updated.") : t("brands.toast.created", "Created.")
      );
    } catch (e2) {
      const data = e2?.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setGlobalError(data?.message || t("brands.toast.saveFailed", "Save failed"));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    try {
      await brandsApi.remove(getRowId(deleteTarget)); // ✅ brandsApi
      await load({ mode: "refresh" });

      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", t("brands.toast.deleted", "Deleted."));
    } catch (e) {
      const msg = e?.response?.data?.message || t("brands.toast.deleteFailed", "Delete failed.");
      showToast("danger", msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">{t("brands.title", "Brands")}</h4>
          <div className="text-muted small">{t("brands.subtitle", "Manage brands")}</div>
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
                {t("brands.refreshing", "Refreshing...")}
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2" />
                {t("brands.refresh", "Refresh")}
              </>
            )}
          </button>

          <button className="btn btn-warning" onClick={openCreate} disabled={initialLoading}>
            <i className="bi bi-plus-lg me-2" />
            {t("brands.new", "New brand")}
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {initialLoading ? (
            <div className="d-flex align-items-center gap-2 text-muted mb-3">
              <div className="spinner-border spinner-border-sm" />
              {t("brands.loading", "Loading...")}
            </div>
          ) : null}

          <div className="table-responsive">
            <table ref={tableRef} className="table align-middle mb-0">
              <thead>
                <tr className="text-muted small">
                  <th style={{ width: 90 }}>{t("brands.table.logo", "Logo")}</th>
                  <th>{t("brands.table.name", "Name")}</th>
                  <th>{t("brands.table.slug", "Slug")}</th>
                  <th style={{ width: 120 }}>{t("brands.table.status", "Status")}</th>
                  <th>{t("brands.table.description", "Description")}</th>
                  <th style={{ width: 180 }} className="text-end">
                    {t("brands.table.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody />
            </table>
          </div>
        </div>
      </div>

      {/* Modal create/edit */}
      {open && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editing ? t("brands.modal.editTitle", "Edit") : t("brands.modal.createTitle", "Create")}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>

                <form onSubmit={onSubmit}>
                  <div className="modal-body">
                    {globalError && <div className="alert alert-danger py-2">{globalError}</div>}

                    <div className="mb-3">
                      <label className="form-label">{t("brands.modal.name", "Name")}</label>
                      <input
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder={t("brands.modal.placeholderName", "Ex: Nike")}
                        autoFocus
                      />
                      {errors.name && <span className="text-danger small">{errors.name[0]}</span>}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">{t("brands.modal.logo", "Logo")}</label>

                      <div className="card border-0 shadow-sm">
                        <div className="card-body">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              style={{
                                width: 72,
                                height: 72,
                                borderRadius: 12,
                                border: "1px solid rgba(0,0,0,.08)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                                background: "rgba(0,0,0,.02)",
                              }}
                            >
                              {logoPreview || form.logo ? (
                                <img
                                  src={logoPreview || logoUrl(form.logo)}
                                  alt="logo"
                                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                />
                              ) : (
                                <i className="bi bi-image text-muted" style={{ fontSize: 24 }} />
                              )}
                            </div>

                            <div className="flex-grow-1">
                              <div className="d-flex flex-wrap gap-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className={`form-control ${errors.logo ? "is-invalid" : ""}`}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0] || null;
                                    setLogoFile(f);

                                    if (logoPreview) URL.revokeObjectURL(logoPreview);
                                    setLogoPreview(f ? URL.createObjectURL(f) : "");
                                  }}
                                />
                                {(logoPreview || form.logo) && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => {
                                      setLogoFile(null);
                                      if (logoPreview) URL.revokeObjectURL(logoPreview);
                                      setLogoPreview("");
                                    }}
                                  >
                                    {t("brands.modal.removeLogo", "Remove")}
                                  </button>
                                )}
                              </div>

                              <div className="form-text">
                                {t("brands.modal.logoHelp", "Choose an image file (PNG, JPG, SVG).")}
                              </div>

                              {errors.logo && <span className="text-danger small">{errors.logo[0]}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">{t("brands.modal.description", "Description")}</label>
                      <textarea
                        className={`form-control ${errors.description ? "is-invalid" : ""}`}
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder={t("brands.modal.placeholderDescription", "Short description")}
                      />
                      {errors.description && <span className="text-danger small">{errors.description[0]}</span>}
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
                        {t("brands.modal.active", "Active")}
                      </label>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>
                      {t("brands.modal.cancel", "Cancel")}
                    </button>
                    <button className="btn btn-warning" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          {t("brands.modal.saving", "Saving...")}
                        </>
                      ) : (
                        t("brands.modal.save", "Save")
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

      {/* Modal show */}
      {showOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{t("brands.show.title", "Brand details")}</h5>
                  <button type="button" className="btn-close" onClick={closeShow} />
                </div>

                <div className="modal-body">
                  {showing ? (
                    <div className="d-flex gap-3">
                      <div
                        style={{
                          width: 86,
                          height: 86,
                          borderRadius: 14,
                          border: "1px solid rgba(0,0,0,.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          background: "rgba(0,0,0,.02)",
                          flex: "0 0 auto",
                        }}
                      >
                        {showing.logo ? (
                          <img src={logoUrl(showing.logo)} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        ) : (
                          <i className="bi bi-image text-muted" style={{ fontSize: 26 }} />
                        )}
                      </div>

                      <div className="flex-grow-1">
                        <div className="mb-2">
                          <div className="text-muted small">{t("brands.table.name", "Name")}</div>
                          <div className="fw-semibold">{showing.name || "—"}</div>
                        </div>

                        <div className="mb-2">
                          <div className="text-muted small">{t("brands.table.slug", "Slug")}</div>
                          <div>{showing.slug || "—"}</div>
                        </div>

                        <div className="mb-2">
                          <div className="text-muted small">{t("brands.table.status", "Status")}</div>
                          <div>
                            {showing.is_active ? (
                              <span className="badge text-bg-success">Active</span>
                            ) : (
                              <span className="badge text-bg-secondary">Inactive</span>
                            )}
                          </div>
                        </div>

                        <div className="mb-0">
                          <div className="text-muted small">{t("brands.table.description", "Description")}</div>
                          <div className="text-muted">{showing.description || "—"}</div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={closeShow}>
                    {t("brands.modal.cancel", "Close")}
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
                  <h5 className="modal-title">{t("brands.delete.title", "Confirm")}</h5>
                  <button type="button" className="btn-close" onClick={closeDeleteModal} />
                </div>

                <div className="modal-body">
                  {deleteTarget ? (
                    <p className="mb-0">
                      {t("brands.delete.message", "Delete brand")} <b>{deleteTarget.name}</b> ?
                    </p>
                  ) : (
                    <p className="mb-0">{t("brands.delete.message2", "Delete this brand?")}</p>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={closeDeleteModal}
                    disabled={deleting}
                  >
                    {t("brands.modal.cancel", "Cancel")}
                  </button>

                  <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                    {deleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        {t("brands.delete.deleting", "Deleting...")}
                      </>
                    ) : (
                      t("brands.delete.btn", "Delete")
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
