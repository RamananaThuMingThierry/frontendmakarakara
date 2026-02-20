import React, { useEffect, useState } from "react";
import { categoriesApi } from "../../../api/categories";
import { useParams, useNavigate } from "react-router-dom";
import { useI18n } from "../../../hooks/website/I18nContext";

/* -------------------- Produits UI -------------------- */

function ProductCard({ p, onEdit, onDelete, onDetails }) {
  return (
    <div className="card border-0 shadow-sm h-100" style={{ background: "#fafafa" }}>
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between gap-3">
          {/* Image à droite */}
          <div className="rounded bg-light overflow-hidden flex-shrink-0" style={{ width: 86, height: 86 }}>
            <img
              src={p.image_url || "/images/box.png"}
              alt={p.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => (e.currentTarget.src = "/images/box.png")}
            />
          </div>

          {/* Infos */}
          <div className="flex-grow-1">
            <div className="d-flex align-items-start justify-content-between gap-2">
              <div>
                <div className="fw-semibold">{p.name}</div>
                {p.sku ? <div className="text-muted small">SKU: {p.sku}</div> : null}
                {p.barcode ? <div className="text-muted small">Barcode: {p.barcode}</div> : null}
              </div>

              {p.is_active !== undefined ? (
                p.is_active ? (
                  <span className="badge text-bg-success">
                    <i className="bi bi-check-circle-fill me-1" />
                    Active
                  </span>
                ) : (
                  <span className="badge text-bg-secondary">
                    <i className="bi bi-x-circle-fill me-1" />
                    Inactive
                  </span>
                )
              ) : null}
            </div>

            <div className="mt-2 small">
              {p.price !== undefined ? <h5 className="fw-bold text-danger mb-0">{p.price} MGA</h5> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="card-footer bg-transparent border-0">
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onDetails?.(p)}>
            <i className="bi bi-info-circle me-1" />
            Détails
          </button>

          <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => onEdit?.(p)}>
            <i className="bi bi-pencil-square me-1" />
            Modifier
          </button>

          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete?.(p)}>
            <i className="bi bi-trash3 me-1" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductsGrid({ products, onEditProduct, onDeleteProduct, onDetailsProduct }) {
  if (!products?.length) return <div className="text-muted small">Aucun produit.</div>;

  return (
    <div className="row g-3">
      {products.map((p) => (
        <div className="col-12 col-md-6 col-xl-4" key={p.id}>
          <ProductCard p={p} onEdit={onEditProduct} onDelete={onDeleteProduct} onDetails={onDetailsProduct} />
        </div>
      ))}
    </div>
  );
}

/* -------------------- Category Accordion Node -------------------- */

function CategoryNodeAccordion({
  node,
  level = 0,
  parentAccordionId = "catTreeRoot",
  onEditCategory,
  onAskDeleteCategory,
  onAddProduct,
  onOpenCreateSubCategoryModal,
}) {
  const accordionId = `${parentAccordionId}-L${level}-N${node.id}`;
  const headingId = `heading-${accordionId}`;
  const collapseId = `collapse-${accordionId}`;
  const defaultOpen = level === 0;

  return (
    <div className="accordion-item">
      <h2 className="accordion-header" id={headingId}>
        <button
          className={`accordion-button ${defaultOpen ? "" : "collapsed"}`}
          type="button"
          data-bs-toggle="collapse"
          data-bs-target={`#${collapseId}`}
          aria-expanded={defaultOpen} // ✅ booléen (corrige ARIA)
          aria-controls={collapseId}
        >
          <div className="d-flex align-items-center justify-content-between w-100 gap-2">
            <div className="d-flex flex-column">
              <span className="fw-semibold">
                <i className="bi bi-folder-fill text-warning me-2" />
                {node.name} <span className="text-muted small fw-normal">({node.slug || "-"})</span>
              </span>

              <div className="text-muted small">
                Produits: <b>{node.products?.length ?? 0}</b> · Sous-catégories: <b>{node.children?.length ?? 0}</b>
              </div>
            </div>

            <div className="ms-auto d-flex align-items-center gap-2">
              {node.is_active ? (
                <span className="badge text-bg-success">
                  <i className="bi bi-check-circle-fill me-1" /> Active
                </span>
              ) : (
                <span className="badge text-bg-secondary">
                  <i className="bi bi-x-circle-fill me-1" /> Inactive
                </span>
              )}

              {/* ✅ Ajouter sous-catégorie (modal) */}
              <button
                className="btn btn-sm btn-outline-primary"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenCreateSubCategoryModal?.(node);
                }}
                title="Ajouter une sous-catégorie"
              >
                <i className="bi bi-plus-lg" />
              </button>

              {/* ✅ Modifier => redirect */}
              <button
                className="btn btn-sm btn-outline-dark"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEditCategory?.(node);
                }}
                title="Modifier"
              >
                <i className="bi bi-pencil-square" />
              </button>

              {/* ✅ Supprimer => modal confirm */}
              <button
                className="btn btn-sm btn-outline-danger"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAskDeleteCategory?.(node);
                }}
                title="Supprimer"
              >
                <i className="bi bi-trash3" />
              </button>
            </div>
          </div>
        </button>
      </h2>

      <div
        id={collapseId}
        className={`accordion-collapse collapse ${defaultOpen ? "show" : ""}`}
        aria-labelledby={headingId}
        data-bs-parent={level === 0 ? `#${parentAccordionId}` : undefined}
      >
        <div className="accordion-body">
          {/* Produits + bouton Ajouter produit (redirect) */}
          <div className="mb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="mb-0">Produits</h6>
              <button className="btn btn-sm btn-dark" type="button" onClick={() => onAddProduct?.(node)}>
                <i className="bi bi-plus-lg me-1" /> Ajouter un produit
              </button>
            </div>

            <ProductsGrid products={node.products} />
          </div>

          {/* Sous catégories */}
          <div>
            <h6 className="mb-2">Sous-catégories</h6>

            {node.children?.length ? (
              <div className="accordion" id={accordionId}>
                {node.children.map((ch) => (
                  <CategoryNodeAccordion
                    key={ch.id}
                    node={ch}
                    level={level + 1}
                    parentAccordionId={accordionId}
                    onEditCategory={onEditCategory}
                    onAskDeleteCategory={onAskDeleteCategory}
                    onAddProduct={onAddProduct}
                    onOpenCreateSubCategoryModal={onOpenCreateSubCategoryModal}
                  />
                ))}
              </div>
            ) : (
              <div className="text-muted small">Aucune sous-catégorie.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Page -------------------- */

export default function CategoryManagePage() {
  const { encryptedId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  // delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // create sub-category modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createParent, setCreateParent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [createErrors, setCreateErrors] = useState({});
  const [createGlobalError, setCreateGlobalError] = useState("");
  const [form, setForm] = useState({ name: "", is_active: true });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await categoriesApi.show(encryptedId);
      setData(res?.data ?? res);
    } catch (e) {
      setError(e?.response?.data?.message || t("categories.manage.loadFailed", "Load failed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [encryptedId]);

  /* --------- 1) Ajouter une sous-catégorie (modal) --------- */
  function onOpenCreateSubCategoryModal(parentCat) {
    setCreateParent(parentCat);
    setForm({ name: "", is_active: true });
    setCreateErrors({});
    setCreateGlobalError("");
    setCreateOpen(true);
  }

  function closeCreateModal() {
    if (saving) return;
    setCreateOpen(false);
    setCreateParent(null);
  }

  async function submitCreateSubCategory(e) {
    e.preventDefault();
    setCreateErrors({});
    setCreateGlobalError("");

    if (!form.name.trim()) {
      setCreateErrors({ name: ["Le nom est requis."] });
      return;
    }

    const payload = {
      name: form.name.trim(),
      is_active: !!form.is_active,
      // ✅ parent direct fixé, pas de select
      parent_id: createParent?.id ?? null,
    };

    setSaving(true);
    try {
      await categoriesApi.create(payload);
      setCreateOpen(false);
      setCreateParent(null);
      await load(); // refresh tree
    } catch (err) {
      const d = err?.response?.data;
      if (d?.errors) setCreateErrors(d.errors);
      else setCreateGlobalError(d?.message || "Création échouée.");
    } finally {
      setSaving(false);
    }
  }

  /* --------- 2) Ajouter produit => redirect --------- */
  function onAddProduct(cat) {
    // ✅ redirection vers createProduct (adapte si route différente)
    navigate(`/admin/products/create?category_id=${cat.encrypted_id}`);
  }

  /* --------- 3) Modifier catégorie => redirect --------- */
function onEditCategory(cat) {
  if (!cat?.encrypted_id) {
    console.warn("encrypted_id manquant pour la catégorie:", cat);
    return;
  }
  navigate(`/admin/categories/${cat.encrypted_id}/edit`);
}

  function onAskDeleteCategory(cat) {
    setDeleteTarget(cat);
    setDeleteOpen(true);
  }

  async function confirmDeleteCategory() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await categoriesApi.remove(deleteTarget.encrypted_id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      navigate("/admin/categories");
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex align-items-center gap-2 text-muted">
          <div className="spinner-border spinner-border-sm" />
          {t("categories.loading", "Loading...")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-1">{t("categories.manage.title", "Category details")}</h4>
          <div className="text-muted small">{t("categories.manage.subtitle", "Tree + products")}</div>
        </div>

        <button className="btn btn-outline-secondary" onClick={() => navigate("/admin/categories")} type="button">
          <i className="bi bi-arrow-left me-2" />
          {t("common.back", "Back")}
        </button>
      </div>

      {/* details */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between gap-2">
            <div>
              <h5 className="mb-1">{data.name}</h5>
              <div className="text-muted small">{data.slug}</div>
            </div>
            <div>
              {data.is_active ? (
                <span className="badge text-bg-success">Active</span>
              ) : (
                <span className="badge text-bg-secondary">Inactive</span>
              )}
            </div>
          </div>

          <hr />

          <div className="row g-2 small">
            <div className="col-12 col-md-6">
              <div className="text-muted">Sous-catégories (direct) :</div>
              <div className="fw-semibold">{data.children?.length ?? 0}</div>
            </div>
            <div className="col-12 col-md-6">
              <div className="text-muted">Produits (direct) :</div>
              <div className="fw-semibold">{data.products?.length ?? 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="d-flex justify-content-between my-3">
        <h4>Gestion des produits</h4>

        <div className="d-flex gap-2">
          {/* ✅ 1) Ajouter une catégorie => modal (parent = current root data) */}
          <button
            className="btn btn-dark"
            onClick={() => onOpenCreateSubCategoryModal(data)}
            title="Ajouter une catégorie"
            type="button"
          >
            <i className="bi bi-plus-circle" />
            <span className="d-none d-md-inline ms-2">Ajouter une sous-catégorie</span>
          </button>

          {/* ✅ 2) Ajouter un produit => redirect */}
          <button className="btn btn-outline-dark" onClick={() => onAddProduct(data)} title="Ajouter un produit" type="button">
            <i className="bi bi-plus-circle" />
            <span className="d-none d-md-inline ms-2">Ajouter un produit</span>
          </button>
        </div>
      </div>

      {/* tree */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h6 className="mb-3">Arbre catégories</h6>

          <div className="accordion" id="catTreeRoot">
            <CategoryNodeAccordion
              node={data}
              level={0}
              parentAccordionId="catTreeRoot"
              onEditCategory={onEditCategory}
              onAskDeleteCategory={onAskDeleteCategory}
              onAddProduct={onAddProduct}
              onOpenCreateSubCategoryModal={onOpenCreateSubCategoryModal}
            />
          </div>
        </div>
      </div>

      {/* ✅ Modal create sub-category */}
      {createOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Ajouter une sous-catégorie</h5>
                  <button type="button" className="btn-close" onClick={closeCreateModal} disabled={saving} />
                </div>

                <form onSubmit={submitCreateSubCategory}>
                  <div className="modal-body">
                    {createGlobalError ? <div className="alert alert-danger py-2">{createGlobalError}</div> : null}

                    {/* Parent fixe (pas de select) */}
                    <div className="mb-3">
                      <label className="form-label">Parent</label>
                      <input className="form-control" value={createParent?.name || ""} disabled />
                      <div className="form-text">Le parent est défini automatiquement.</div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Nom</label>
                      <input
                        className={`form-control ${createErrors.name ? "is-invalid" : ""}`}
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Ex: Huille"
                        autoFocus
                      />
                      {createErrors.name ? <div className="invalid-feedback">{createErrors.name[0]}</div> : null}
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
                        Active
                      </label>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeCreateModal} disabled={saving}>
                      Annuler
                    </button>
                    <button type="submit" className="btn btn-dark" disabled={saving}>
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

          <div className="modal-backdrop fade show" onClick={closeCreateModal} />
        </>
      )}

      {/* ✅ Modal delete catégorie */}
      {deleteOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Confirmation</h5>
                  <button type="button" className="btn-close" onClick={() => setDeleteOpen(false)} disabled={deleting} />
                </div>

                <div className="modal-body">
                  <p className="mb-0">
                    Supprimer la catégorie <b>{deleteTarget?.name}</b> ?
                  </p>
                  <div className="text-muted small mt-2">
                    Attention: la suppression peut échouer si la catégorie contient des sous-catégories ou des produits.
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                    Annuler
                  </button>

                  <button type="button" className="btn btn-danger" onClick={confirmDeleteCategory} disabled={deleting}>
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

          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
}