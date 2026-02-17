import React, { useEffect, useMemo, useRef, useState } from "react";
import { categoriesApi } from "../../../api/categories";
import { useI18n } from "../../../hooks/website/I18nContext";

import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

export default function CategoriesPage() {
  const { lang, t } = useI18n();

  // DataTables JSON dans public/lang/{lang}.json
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

  function flattenCategories(tree, level = 0, parent = null) {
    const out = [];
    (tree || []).forEach((node) => {
      out.push({
        ...node,
        level,
        parent_name: parent?.name ?? null,
        children: node.children ?? [],
      });
      if (node.children?.length) out.push(...flattenCategories(node.children, level + 1, node));
    });
    return out;
  }

  // modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({ name: "", slug: "", parent_id: "", is_active: true });

  const tableRef = useRef(null);
  const dtRef = useRef(null);

  // items ref pour handlers jquery
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  async function load({ mode = "refresh" } = {}) {
    if (mode === "initial") setInitialLoading(true);
    else setRefreshing(true);

    try {
      const res = await categoriesApi.list();
      const tree = Array.isArray(res) ? res : res?.data ?? [];
      setItems(flattenCategories(tree));
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

  const parentOptions = useMemo(() => {
    return items.map((c) => ({ id: c.id, label: `${"— ".repeat(c.level || 0)}${c.name}` }));
  }, [items]);

  // ✅ (Re)Init DataTable à chaque changement de langue (et après initialLoading)
  useEffect(() => {
    if (initialLoading) return;
    if (!tableRef.current) return;

    const $table = $(tableRef.current);

    // destroy si existe
    if (dtRef.current) {
      try {
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
        { data: null, render: (d, t, row, meta) => meta.row + 1 },
        {
          data: "name",
          render: (data, type, row) => {
            const pad = (row.level || 0) * 18;
            const arrow = row.level > 0 ? "↳ " : "";
            const safe = (data ?? "").toString();
            return `<span style="padding-left:${pad}px">${arrow}${safe}</span>`;
          },
        },
        { data: "slug", defaultContent: "" },
        {
          data: "is_active",
          render: (v) =>
            v
              ? `<span class="badge text-bg-success">Active</span>`
              : `<span class="badge text-bg-secondary">Inactive</span>`,
        },
        { data: "parent_name", defaultContent: "-" },
        { data: "children", render: (arr) => (arr?.length ? `${arr.length}` : "-") },
        {
          data: null,
          orderable: false,
          className: "text-end",
          render: (d, t, row) => `
            <button class="btn btn-sm btn-outline-dark me-2 js-edit" data-id="${row.id}">
              <i class="bi bi-pencil-square me-1"></i>Edit
            </button>
            <button class="btn btn-sm btn-outline-danger js-del" data-id="${row.id}">
              <i class="bi bi-trash3 me-1"></i>Delete
            </button>
          `,
        },
      ],
    });

    // handlers
    $table.on("click", ".js-edit", (e) => {
      const id = Number($(e.currentTarget).data("id"));
      const cat = itemsRef.current.find((x) => x.id === id);
      if (cat) openEdit(cat);
    });

    $table.on("click", ".js-del", (e) => {
      const id = Number($(e.currentTarget).data("id"));
      const cat = itemsRef.current.find((x) => x.id === id);
      if (cat) onDeleteAsk(cat);
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

  // ✅ Update rows quand items change (sans toucher langue)
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

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {initialLoading ? (
            <div className="d-flex align-items-center gap-2 text-muted mb-3">
              <div className="spinner-border spinner-border-sm" />
              {t("categories.loading", "Loading...")}
            </div>
          ) : null}

          <div className="table-responsive">
            <table ref={tableRef} className="table align-middle mb-0">
              <thead>
                <tr className="text-muted small">
                  <th style={{ width: 70 }}>{t("categories.table.index", "#")}</th>
                  <th>{t("categories.table.name", "Name")}</th>
                  <th>{t("categories.table.slug", "Slug")}</th>
                  <th>{t("categories.table.status", "Status")}</th>
                  <th>{t("categories.table.parent", "Parent")}</th>
                  <th>{t("categories.table.children", "Children")}</th>
                  <th style={{ width: 180 }} className="text-end">
                    {t("categories.table.actions", "Actions")}
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
                      <div className="form-text">{t("categories.modal.slugHelp", "")}</div>
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
                      <div className="form-text">{t("categories.modal.parentHelp", "")}</div>
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
