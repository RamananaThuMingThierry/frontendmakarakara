import React, { useEffect, useMemo, useState } from "react";
import { categoriesApi } from "../../../api/categories";

export default function CategoriesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);

  // modal form
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // category object or null
  const [form, setForm] = useState({ name: "", slug: "", is_active: true });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => (x.name || "").toLowerCase().includes(s));
  }, [items, q]);

  async function load() {
    setLoading(true);
    try {
      const data = await categoriesApi.list();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", slug: "", is_active: true });
    setOpen(true);
  }

  function openEdit(cat) {
    setEditing(cat);
    setForm({
      name: cat.name ?? "",
      slug: cat.slug ?? "",
      is_active: !!cat.is_active,
    });
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      if (editing) {
        const updated = await categoriesApi.update(editing.id, form);
        setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        const created = await categoriesApi.create(form);
        setItems((prev) => [created, ...prev]);
      }
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(cat) {
    const ok = window.confirm(`Supprimer la catégorie "${cat.name}" ?`);
    if (!ok) return;

    await categoriesApi.remove(cat.id);
    setItems((prev) => prev.filter((x) => x.id !== cat.id));
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">Categories</h4>
          <div className="text-muted small">Gérer les catégories du shop</div>
        </div>

        <div className="d-flex gap-2">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search" />
            </span>
            <input
              className="form-control"
              placeholder="Rechercher..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

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
          ) : filtered.length === 0 ? (
            <div className="text-muted">Aucune catégorie.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th style={{ width: 70 }}>#</th>
                    <th>Nom</th>
                    <th>Slug</th>
                    <th style={{ width: 120 }}>Statut</th>
                    <th style={{ width: 180 }} className="text-end">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((cat, idx) => (
                    <tr key={cat.id}>
                      <td className="text-muted">{idx + 1}</td>
                      <td className="fw-semibold">{cat.name}</td>
                      <td className="text-muted">{cat.slug}</td>
                      <td>
                        {cat.is_active ? (
                          <span className="badge text-bg-success">Active</span>
                        ) : (
                          <span className="badge text-bg-secondary">Inactive</span>
                        )}
                      </td>
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
                          onClick={() => onDelete(cat)}
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
                    <div className="mb-3">
                      <label className="form-label">Nom</label>
                      <input
                        className="form-control"
                        value={form.name}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, name: e.target.value }))
                        }
                        placeholder="Ex: Shoes"
                        autoFocus
                      />
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

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="active"
                        checked={form.is_active}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, is_active: e.target.checked }))
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
    </div>
  );
}
