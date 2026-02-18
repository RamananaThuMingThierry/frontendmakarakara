import React, { useEffect, useMemo, useRef, useState } from "react";
import { usersApi } from "../../../api/user";
import { useI18n } from "../../../hooks/website/I18nContext";

import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

export default function UsersPage() {
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

  // modal create/edit
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");

  // delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [avatarPreview, setAvatarPreview] = useState("");

  // form (adapte aux champs de ton backend)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    status: "active", // ou boolean selon ton API
    role: "admin",      // ✅ admin | delivery
    avatar: null,       // ✅ File
    password: "",
    password_confirmation: "",
    role_ids: [], // si tu gères l’assignation de rôles côté API
  });

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
      const res = await usersApi.list();
      const list = Array.isArray(res) ? res : res?.data ?? [];
      setItems(list);
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
    setForm({
      name: "",
      email: "",
      phone: "",
      status: "active",
      password: "",
      password_confirmation: "",
      role_ids: [],
    });
    setErrors({});
    setGlobalError("");
    setOpen(true);
  }

function openEdit(u) {
  setEditing(u);
  setForm({
    name: u.name ?? "",
    email: u.email ?? "",
    phone: u.phone ?? "",
    status: u.status ?? "active",
    role: (u.roles?.[0]?.name) || "admin", // ✅ 1 seul role
    avatar: null, // on ne met pas le fichier ici
    password: "",
    password_confirmation: "",
  });

  setAvatarPreview(u.avatar_url ?? ""); // si dispo
  setOpen(true);
}


  function closeModal() {
    if (saving) return;
    setOpen(false);
  }

  function onDeleteAsk(u) {
    setDeleteTarget(u);
    setDeleteOpen(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  // ✅ Init / Reinit DataTable quand langue change
  useEffect(() => {
    if (initialLoading) return;
    if (!tableRef.current) return;

    const $table = $(tableRef.current);

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
        { data: null, render: (d, t2, row, meta) => meta.row + 1 },
        { data: "name", defaultContent: "" },
        { data: "email", defaultContent: "" },
        { data: "phone", defaultContent: "" },
        {
          data: "roles",
          render: (roles) => {
            const arr = Array.isArray(roles) ? roles : [];
            if (!arr.length) return "-";
            return arr
              .map((r) => `<span class="badge text-bg-dark me-1">${(r?.name ?? "").toString()}</span>`)
              .join("");
          },
        },
        {
          data: "status",
          render: (v) => {
            // adapte selon ton backend: "active"/"inactive" ou 1/0 etc.
            const active = v === "active" || v === 1 || v === true || v === "1";
            return active
              ? `<span class="badge text-bg-success">${t("users.status.active", "Active")}</span>`
              : `<span class="badge text-bg-secondary">${t("users.status.inactive", "Inactive")}</span>`;
          },
        },
        {
          data: null,
          orderable: false,
          className: "text-end",
          render: (d, t2, row) => `
            <button class="btn btn-sm btn-outline-dark me-2 js-edit" data-id="${row.id}">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger js-del" data-id="${row.id}">
              <i class="bi bi-trash3"></i>
            </button>
          `,
        },
      ],
    });

    $table.on("click", ".js-edit", (e) => {
      const id = Number($(e.currentTarget).data("id"));
      const u = itemsRef.current.find((x) => Number(x.id) === id);
      if (u) openEdit(u);
    });

    $table.on("click", ".js-del", (e) => {
      const id = Number($(e.currentTarget).data("id"));
      const u = itemsRef.current.find((x) => Number(x.id) === id);
      if (u) onDeleteAsk(u);
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
      setErrors({ name: [t("users.toast.nameRequired", "Name is required")] });
      return;
    }
    if (!form.email.trim()) {
      setErrors({ email: [t("users.toast.emailRequired", "Email is required")] });
      return;
    }

    // payload (adapte selon ton API)
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      status: form.status,
        role: form.role,  
    };

if (form.avatar) payload.avatar = form.avatar; // ✅ File

if (!editing || form.password) {
  payload.password = form.password;
  payload.password_confirmation = form.password_confirmation;
}

    setSaving(true);
    try {
      if (editing) await usersApi.update(editing.id, payload);
      else await usersApi.create(payload);

      await load({ mode: "refresh" });
      setOpen(false);

      showToast(
        "success",
        editing ? t("users.toast.updated", "Updated.") : t("users.toast.created", "Created.")
      );
    } catch (e2) {
      const data = e2?.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setGlobalError(data?.message || t("users.toast.saveFailed", "Save failed"));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    try {
      await usersApi.remove(deleteTarget.id);
      await load({ mode: "refresh" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", t("users.toast.deleted", "Deleted."));
    } catch (e) {
      const msg = e?.response?.data?.message || t("users.toast.deleteFailed", "Delete failed.");
      showToast("danger", msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">{t("users.title", "Users")}</h4>
          <div className="text-muted small">{t("users.subtitle", "Manage users")}</div>
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
                {t("users.refreshing", "Refreshing...")}
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2" />
                {t("users.refresh", "Refresh")}
              </>
            )}
          </button>

          <button className="btn btn-warning" onClick={openCreate} disabled={initialLoading}>
            <i className="bi bi-plus-lg me-2" />
            {t("users.new", "New user")}
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {initialLoading ? (
            <div className="d-flex align-items-center gap-2 text-muted mb-3">
              <div className="spinner-border spinner-border-sm" />
              {t("users.loading", "Loading...")}
            </div>
          ) : null}

          <div className="table-responsive">
            <table ref={tableRef} className="table align-middle mb-0">
              <thead>
                <tr className="text-muted small">
                  <th style={{ width: 70 }}>{t("users.table.index", "#")}</th>
                  <th>{t("users.table.name", "Name")}</th>
                  <th>{t("users.table.email", "Email")}</th>
                  <th>{t("users.table.phone", "Phone")}</th>
                  <th>{t("users.table.roles", "Roles")}</th>
                  <th>{t("users.table.status", "Status")}</th>
                  <th style={{ width: 180 }} className="text-end">
                    {t("users.table.actions", "Actions")}
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
                    {editing ? t("users.modal.editTitle", "Edit user") : t("users.modal.createTitle", "Create user")}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>

                <form onSubmit={onSubmit}>
                  <div className="modal-body">
                    {globalError && <div className="alert alert-danger py-2">{globalError}</div>}
<div className="mb-3">
  <label className="form-label">{t("users.modal.avatar", "Avatar")}</label>

  <input
    type="file"
    className={`form-control ${errors.avatar ? "is-invalid" : ""}`}
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0] || null;
      setForm((p) => ({ ...p, avatar: file }));

      if (file) setAvatarPreview(URL.createObjectURL(file));
    }}
  />

  {errors.avatar && <span className="text-danger small">{errors.avatar[0]}</span>}

  {avatarPreview ? (
    <div className="mt-2">
      <img
        src={avatarPreview}
        alt="avatar"
        style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 12 }}
      />
    </div>
  ) : null}
</div>

                    <div className="mb-3">
                      <label className="form-label">{t("users.modal.name", "Name")}</label>
                      <input
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      />
                      {errors.name && <span className="text-danger small">{errors.name[0]}</span>}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">{t("users.modal.email", "Email")}</label>
                      <input
                        className={`form-control ${errors.email ? "is-invalid" : ""}`}
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      />
                      {errors.email && <span className="text-danger small">{errors.email[0]}</span>}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">{t("users.modal.phone", "Phone")}</label>
                      <input
                        className="form-control"
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">{t("users.modal.status", "Status")}</label>
                      <select
                        className="form-select"
                        value={form.status ?? "active"}
                        onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                      >
                        <option value="active">{t("users.status.active", "Active")}</option>
                        <option value="inactive">{t("users.status.inactive", "Inactive")}</option>
                      </select>
                    </div>

                    {/* Password: obligatoire à la création, optionnel en édition */}
                    <div className="mb-3">
                      <label className="form-label">
                        {t("users.modal.password", "Password")}
                        {editing ? <span className="text-muted small ms-2">({t("users.modal.passwordOptional", "optional")})</span> : null}
                      </label>
                      <input
                        type="password"
                        className={`form-control ${errors.password ? "is-invalid" : ""}`}
                        value={form.password}
                        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      />
                      {errors.password && <span className="text-danger small">{errors.password[0]}</span>}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">{t("users.modal.passwordConfirm", "Confirm password")}</label>
                      <input
                        type="password"
                        className="form-control"
                        value={form.password_confirmation}
                        onChange={(e) => setForm((p) => ({ ...p, password_confirmation: e.target.value }))}
                      />
                    </div>

<div className="mb-3">
  <label className="form-label">{t("users.modal.role", "Role")}</label>
  <select
    className={`form-select ${errors.role ? "is-invalid" : ""}`}
    value={form.role}
    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
  >
    <option value="admin">admin</option>
    <option value="delivery">delivery</option>
  </select>
  {errors.role && <span className="text-danger small">{errors.role[0]}</span>}
</div>

                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>
                      {t("users.modal.cancel", "Cancel")}
                    </button>
                    <button className="btn btn-warning" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          {t("users.modal.saving", "Saving...")}
                        </>
                      ) : (
                        t("users.modal.save", "Save")
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
                  <h5 className="modal-title">{t("users.delete.title", "Confirm")}</h5>
                  <button type="button" className="btn-close" onClick={closeDeleteModal} />
                </div>

                <div className="modal-body">
                  {deleteTarget ? (
                    <p className="mb-0">
                      {t("users.delete.message", "Delete user")} <b>{deleteTarget.name}</b> ?
                    </p>
                  ) : (
                    <p className="mb-0">{t("users.delete.message2", "Delete this user?")}</p>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeDeleteModal} disabled={deleting}>
                    {t("users.modal.cancel", "Cancel")}
                  </button>

                  <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                    {deleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        {t("users.delete.deleting", "Deleting...")}
                      </>
                    ) : (
                      t("users.delete.btn", "Delete")
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
