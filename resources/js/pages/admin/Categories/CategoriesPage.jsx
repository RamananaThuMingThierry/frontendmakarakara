import React, { useEffect, useRef, useState } from "react";
import { categoriesApi } from "../../../api/categories";

import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

export default function CategoriesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

    const [toast, setToast] = useState({ open: false, type: "success", message: "" });
function showToast(type, message) {
  setToast({ open: true, type, message });
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => {
    setToast((t) => ({ ...t, open: false }));
  }, 3500);
}

  // modal form
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // category object or null

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);


  const [form, setForm] = useState({
    name: "",
    slug: "",
    parent_id: "",
    is_active: true,
  });

  // DataTable refs
  const tableRef = useRef(null);
  const dtRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const data = await categoriesApi.list();
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Init / Re-init DataTables quand items changent
  useEffect(() => {
    if (loading) return;
    if (!tableRef.current) return;

    // destroy ancienne instance si existe
    if (dtRef.current) {
      dtRef.current.destroy();
      dtRef.current = null;
    }

    // init
    dtRef.current = $(tableRef.current).DataTable({
      pageLength: 10,
      lengthMenu: [10, 15, 25, 50, 100],
      ordering: true,
      searching: true,
      responsive: true,
      language: {
        url: "https://cdn.datatables.net/plug-ins/1.13.8/i18n/fr-FR.json",
      },
      columnDefs: [
        { orderable: false, targets: [4] }, // Actions non triable
      ],
    });

    // cleanup
    return () => {
      if (dtRef.current) {
        dtRef.current.destroy();
        dtRef.current = null;
      }
    };
  }, [loading, items]);

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

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGlobalError("");


    if (!form.name.trim()) {
        setErrors({ name: ["Le nom est obligatoire."] });
        return;
    }

    const payload = {
      ...form,
      parent_id: form.parent_id ? form.parent_id : null,
    };

    setSaving(true);
    try {
      if (editing) {
        const updated = await categoriesApi.update(editing.id, payload);
        setItems((prev) =>
          prev.map((x) => (x.id === updated.id ? updated : x))
        );
      } else {
        const created = await categoriesApi.create(payload);
        setItems((prev) => [created, ...prev]);
      }
      setOpen(false);
      showToast("success", editing ? "Catégorie mise à jour." : "Catégorie créée.");
    }catch(e){
        // Axios: e.response.data souvent = { message, errors }
        const data = e?.response?.data;

        if (data?.errors) setErrors(data.errors);
        else setGlobalError(data?.message || "Enregistrement échoué");
    }finally {
      setSaving(false);
    }
  }

    function onDeleteAsk(cat) {
    setDeleteTarget(cat);
    setDeleteOpen(true);
    }

    async function confirmDelete() {
  if (!deleteTarget || deleting) return;

  setDeleting(true);
  try {
    await categoriesApi.remove(deleteTarget.id);
    setItems((prev) => prev.filter((x) => x.id !== deleteTarget.id));
    setDeleteOpen(false);
    setDeleteTarget(null);
    showToast("success", "Catégorie supprimée avec succès.");
  } catch (e) {
    const msg = e?.response?.data?.message || "Suppression échouée.";
    showToast("danger", msg);
  } finally {
    setDeleting(false);
  }
}

function closeDeleteModal() {
  if (deleting) return;
  setDeleteOpen(false);
  setDeleteTarget(null);
}


  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">Categories</h4>
          <div className="text-muted small">Gérer les catégories du shop</div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-warning" onClick={openCreate}>
            <i className="bi bi-plus-lg me-2" />
            Nouvelle catégorie
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <div className="spinner-border spinner-border-sm" />
              Chargement...
            </div>
          ) : items.length === 0 ? (
            <div className="text-muted">Aucune catégorie.</div>
          ) : (
            <div className="table-responsive">
              <table ref={tableRef} className="table align-middle mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th style={{ width: 70 }}>#</th>
                    <th>Nom</th>
                    <th>Slug</th>
                    <th>Statut</th>
                    <th>Parent</th>
                    <th style={{ width: 180 }} className="text-end">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((cat, idx) => (
                    <tr key={cat.id}>
                      <td className="text-muted">{idx + 1}</td>
                      <td className="fw-semibold">{cat.name}</td>
                      <td className="text-muted">{cat.slug}</td>
                      <td>
                        {cat.is_active ? (
                          <span className="badge text-bg-success">Active</span>
                        ) : (
                          <span className="badge text-bg-secondary">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="text-muted">{cat.parent_id}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-dark me-2"
                          onClick={() => openEdit(cat)}
                        >
                          <i className="bi bi-pencil-square me-1" />
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => onDeleteAsk(cat)}
                        >
                          <i className="bi bi-trash3 me-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal (Bootstrap style sans JS) */}
      {open && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block" }}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editing ? "Modifier catégorie" : "Nouvelle catégorie"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeModal}
                  />
                </div>


                <form onSubmit={onSubmit}>
                  <div className="modal-body">
                    {globalError && (
                        <div className="alert alert-danger py-2">{globalError}</div>
                    )}

                    <div className="mb-3">
                    <label className="form-label">Nom</label>
                    <input
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Ex: Shoes"
                        autoFocus
                    />
                    {errors.name && (
                        <span className="text-danger small">{errors.name[0]}</span>
                    )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Slug</label>
                      <input
                        className="form-control"
                        value={form.slug}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, slug: e.target.value }))
                        }
                        placeholder="Ex: shoes (optionnel)"
                      />
                      <div className="form-text">
                        Si vide, le backend peut le générer automatiquement.
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Parent</label>
                      <select
                        className="form-select"
                        value={form.parent_id ?? ""}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, parent_id: e.target.value }))
                        }
                      >
                        <option value="">Aucun parent</option>
                        {items
                          .filter((c) => !editing || c.id !== editing.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                      <div className="form-text">
                        Optionnel. Permet de créer une sous-catégorie.
                      </div>
                    </div>

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="active"
                        checked={!!form.is_active}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            is_active: e.target.checked,
                          }))
                        }
                      />
                      <label className="form-check-label" htmlFor="active">
                        Active
                      </label>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={closeModal}
                      disabled={saving}
                    >
                      Annuler
                    </button>
                    <button className="btn btn-warning" disabled={saving}>
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

      {deleteOpen && (
        <>
            <div
            className="modal fade show"
            style={{ display: "block" }}
            role="dialog"
            aria-modal="true"
            >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow">
                <div className="modal-header">
                    <h5 className="modal-title">Confirmation</h5>
                    <button type="button" className="btn-close" onClick={closeDeleteModal} />
                </div>

                <div className="modal-body">
                    {deleteTarget ? (
                    <p className="mb-0">
                        Supprimer la catégorie <b>{deleteTarget.name}</b> ?
                    </p>
                    ) : (
                    <p className="mb-0">Supprimer cette catégorie ?</p>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={closeDeleteModal}
                    disabled={deleting}
                    >
                    Annuler
                    </button>

                    <button
                    type="button"
                    className="btn btn-danger"
                    onClick={confirmDelete}
                    disabled={deleting}
                    >
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

            <div className="modal-backdrop fade show" onClick={closeDeleteModal} />
        </>
        )}

  {toast.open && (
    <div
      className="toast-container position-fixed bottom-0 end-0 p-3"
      style={{ zIndex: 9999 }}
    >
      <div className={`toast show text-bg-${toast.type} border-0`}>
        <div className="d-flex">
          <div className="toast-body">{toast.message}</div>
          <button
            type="button"
            className="btn-close btn-close-white me-2 m-auto"
            onClick={() => setToast((t) => ({ ...t, open: false }))}
          />
        </div>
      </div>
    </div>
  )}
    </div>
  );



}


