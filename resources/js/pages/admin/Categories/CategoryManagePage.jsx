import React, { useEffect, useState } from "react";
import { categoriesApi } from "../../../api/categories";
import { useParams, useNavigate } from "react-router-dom";
import { useI18n } from "../../../hooks/website/I18nContext";

const DEFAULT_IMG = "/images/box.png";

function getProductThumb(product) {
  const img = product?.images?.[0];
  return img?.full_url || (img?.url ? `/${img.url}` : DEFAULT_IMG);
}

function ProductCard({ p, onEdit, onDelete, onDetails, t }) {
  return (
    <div className="card border-0 shadow-sm h-100" style={{ background: "#fafafa" }}>
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div className="rounded bg-light overflow-hidden flex-shrink-0" style={{ width: 86, height: 86 }}>
            <img
              src={getProductThumb(p)}
              alt={p.name}
              className="rounded border"
              style={{ width: 64, height: 64, objectFit: "cover" }}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_IMG;
              }}
            />
          </div>

          <div className="flex-grow-1">
            <div className="d-flex align-items-start justify-content-between gap-2">
              <div>
                <div className="fw-semibold">{p.name}</div>
                {p.sku ? <div className="text-muted small">SKU: {p.sku}</div> : null}
                {p.barcode ? <div className="text-muted small">Barcode: {p.barcode}</div> : null}
              </div>

              {p.is_active !== undefined ? (
                p.is_active ? (
                  <span className="badge text-bg-success"><i className="bi bi-check-circle-fill me-1" />{t("categories.active", "Active")}</span>
                ) : (
                  <span className="badge text-bg-secondary"><i className="bi bi-x-circle-fill me-1" />{t("categories.inactive", "Inactive")}</span>
                )
              ) : null}
            </div>

            <div className="mt-2 small">{p.price !== undefined ? <h5 className="fw-bold text-danger mb-0">{p.price} MGA</h5> : null}</div>
          </div>
        </div>
      </div>

      <div className="card-footer bg-transparent border-0">
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onDetails?.(p)}><i className="bi bi-info-circle me-1" />{t("categories.manage.productDetails", "Details")}</button>
          <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => onEdit?.(p)}><i className="bi bi-pencil-square me-1" />{t("categories.btn.edit", "Edit")}</button>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete?.(p)}><i className="bi bi-trash3 me-1" />{t("categories.btn.delete", "Delete")}</button>
        </div>
      </div>
    </div>
  );
}

function ProductsGrid({ products, onEditProduct, onDeleteProduct, onDetailsProduct, t }) {
  if (!products?.length) return <div className="text-muted small">{t("categories.manage.noProducts", "No products.")}</div>;

  return (
    <div className="row g-3">
      {products.map((p) => (
        <div className="col-12 col-md-6 col-xl-4" key={p.encrypted_id}>
          <ProductCard p={p} onEdit={onEditProduct} onDelete={onDeleteProduct} onDetails={onDetailsProduct} t={t} />
        </div>
      ))}
    </div>
  );
}

function CategoryNodeAccordion({ node, level = 0, parentAccordionId = "catTreeRoot", onEditCategory, onAskDeleteCategory, onAddProduct, onOpenCreateSubCategoryModal, onDetailsProduct, onEditProduct, onDeleteProduct, t }) {
  const accordionId = `${parentAccordionId}-L${level}-N${node.id}`;
  const headingId = `heading-${accordionId}`;
  const collapseId = `collapse-${accordionId}`;
  const defaultOpen = level === 0;

  return (
    <div className="accordion-item">
      <h2 className="accordion-header" id={headingId}>
        <button className={`accordion-button ${defaultOpen ? "" : "collapsed"}`} type="button" data-bs-toggle="collapse" data-bs-target={`#${collapseId}`} aria-expanded={defaultOpen} aria-controls={collapseId}>
          <div className="d-flex align-items-center justify-content-between w-100 gap-2">
            <div className="d-flex flex-column">
              <span className="fw-semibold">
                <i className="bi bi-folder-fill text-warning me-2" />
                {node.is_active ? <i className="bi bi-check-circle-fill p-0 me-2 text-success" /> : <i className="bi bi-x-circle-fill p-0 me-2 text-danger" />}
                {node.name}
                <span className="text-muted small fw-normal">({node.slug || "-"})</span>
              </span>
              <div className="text-muted small">{t("categories.products", "Products")}: <b>{node.products?.length ?? 0}</b> · {t("categories.subcats", "Sub-categories")}: <b>{node.children?.length ?? 0}</b></div>
            </div>

            <div className="ms-auto d-flex align-items-center gap-2">
              <button className="btn btn-sm btn-outline-primary" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenCreateSubCategoryModal?.(node); }} title={t("categories.manage.addSubcategory", "Add subcategory")}><i className="bi bi-plus-lg" /></button>
              <button className="btn btn-sm btn-outline-dark" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditCategory?.(node); }} title={t("categories.btn.edit", "Edit")}><i className="bi bi-pencil-square" /></button>
              <button className="btn btn-sm btn-outline-danger me-4" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAskDeleteCategory?.(node); }} title={t("categories.btn.delete", "Delete")}><i className="bi bi-trash3" /></button>
            </div>
          </div>
        </button>
      </h2>

      <div id={collapseId} className={`accordion-collapse collapse ${defaultOpen ? "show" : ""}`} aria-labelledby={headingId} data-bs-parent={level === 0 ? `#${parentAccordionId}` : undefined}>
        <div className="accordion-body">
          <div className="mb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="mb-0">{t("categories.products", "Products")}</h6>
              <button className="btn btn-sm btn-dark" type="button" onClick={() => onAddProduct?.(node)}><i className="bi bi-plus-lg me-1" />{t("categories.manage.addProduct", "Add product")}</button>
            </div>
            <ProductsGrid products={node.products} onDetailsProduct={onDetailsProduct} onEditProduct={onEditProduct} onDeleteProduct={onDeleteProduct} t={t} />
          </div>

          <div>
            <h6 className="mb-2">{t("categories.subcats", "Sub-categories")}</h6>
            {node.children?.length ? (
              <div className="accordion" id={accordionId}>
                {node.children.map((ch) => <CategoryNodeAccordion key={ch.id} node={ch} level={level + 1} parentAccordionId={accordionId} onEditCategory={onEditCategory} onAskDeleteCategory={onAskDeleteCategory} onAddProduct={onAddProduct} onOpenCreateSubCategoryModal={onOpenCreateSubCategoryModal} onDetailsProduct={onDetailsProduct} onEditProduct={onEditProduct} onDeleteProduct={onDeleteProduct} t={t} />)}
              </div>
            ) : (
              <div className="text-muted small">{t("categories.manage.noSubcategories", "No subcategories.")}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategoryManagePage() {
  const { encryptedId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
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

  useEffect(() => { load(); }, [encryptedId]);

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
      setCreateErrors({ name: [t("categories.toast.nameRequired", "Name is required")] });
      return;
    }
    const payload = { name: form.name.trim(), is_active: !!form.is_active, parent_id: createParent?.id ?? null };
    setSaving(true);
    try {
      await categoriesApi.create(payload);
      setCreateOpen(false);
      setCreateParent(null);
      await load();
    } catch (err) {
      const d = err?.response?.data;
      if (d?.errors) setCreateErrors(d.errors);
      else setCreateGlobalError(d?.message || t("categories.manage.createFailed", "Creation failed."));
    } finally {
      setSaving(false);
    }
  }

  function onAddProduct(cat) { navigate(`/admin/products/create?category_id=${cat.encrypted_id}`); }
  function onEditCategory(cat) { if (!cat?.encrypted_id) return; navigate(`/admin/categories/${cat.encrypted_id}/edit`); }
  function onAskDeleteCategory(cat) { setDeleteTarget(cat); setDeleteOpen(true); }
  function onDetailsProduct(p) { if (!p?.encrypted_id || !encryptedId) return; navigate(`/admin/categories/${encryptedId}/products/${p.encrypted_id}`); }
  function onEditProduct(p) { if (!p?.encrypted_id || !encryptedId) return; navigate(`/admin/categories/${encryptedId}/products/${p.encrypted_id}/edit`); }
  function onDeleteProduct(p) { console.log("delete", p); }

  async function confirmDeleteCategory() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await categoriesApi.remove(deleteTarget.encrypted_id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      navigate("/admin/categories");
    } catch (e) {
      alert(e?.response?.data?.message || t("categories.toast.deleteFailed", "Delete failed."));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <div className="container-fluid"><div className="d-flex align-items-center gap-2 text-muted"><div className="spinner-border spinner-border-sm" />{t("categories.loading", "Loading...")}</div></div>;
  if (error) return <div className="container-fluid"><div className="alert alert-danger">{error}</div></div>;
  if (!data) return null;

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-1">{t("categories.manage.title", "Category details")}</h4>
          <div className="text-muted small">{t("categories.manage.subtitle", "Tree + products")}</div>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/admin/categories")} type="button"><i className="bi bi-arrow-left me-2" />{t("common.back", "Back")}</button>
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between gap-2">
            <div><h5 className="mb-1">{data.name}</h5><div className="text-muted small">{data.slug}</div></div>
            <div>{data.is_active ? <span className="badge text-bg-success">{t("categories.active", "Active")}</span> : <span className="badge text-bg-secondary">{t("categories.inactive", "Inactive")}</span>}</div>
          </div>
          <hr />
          <div className="row g-2 small">
            <div className="col-12 col-md-6"><div className="text-muted">{t("categories.manage.directSubcategories", "Direct subcategories")} :</div><div className="fw-semibold">{data.children?.length ?? 0}</div></div>
            <div className="col-12 col-md-6"><div className="text-muted">{t("categories.manage.directProducts", "Direct products")} :</div><div className="fw-semibold">{data.products?.length ?? 0}</div></div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h6 className="mb-3">{t("categories.manage.treeTitle", "Category tree")}</h6>
          <div className="accordion" id="catTreeRoot"><CategoryNodeAccordion node={data} level={0} parentAccordionId="catTreeRoot" onEditCategory={onEditCategory} onAskDeleteCategory={onAskDeleteCategory} onAddProduct={onAddProduct} onOpenCreateSubCategoryModal={onOpenCreateSubCategoryModal} onDetailsProduct={onDetailsProduct} onEditProduct={onEditProduct} onDeleteProduct={onDeleteProduct} t={t} /></div>
        </div>
      </div>

      {createOpen && <><div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true"><div className="modal-dialog modal-dialog-centered"><div className="modal-content border-0 shadow"><div className="modal-header"><h5 className="modal-title">{t("categories.manage.createSubcategory", "Add subcategory")}</h5><button type="button" className="btn-close" onClick={closeCreateModal} disabled={saving} /></div><form onSubmit={submitCreateSubCategory}><div className="modal-body">{createGlobalError ? <div className="alert alert-danger py-2">{createGlobalError}</div> : null}<div className="mb-3"><label className="form-label">{t("categories.modal.parent", "Parent")}</label><input className="form-control" value={createParent?.name || ""} disabled /><div className="form-text">{t("categories.manage.parentAuto", "The parent is defined automatically.")}</div></div><div className="mb-3"><label className="form-label">{t("categories.modal.name", "Name")}</label><input className={`form-control ${createErrors.name ? "is-invalid" : ""}`} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder={t("categories.manage.subcategoryPlaceholder", "Ex: Oil")} autoFocus />{createErrors.name ? <div className="invalid-feedback">{createErrors.name[0]}</div> : null}</div><div className="form-check"><input className="form-check-input" type="checkbox" id="active" checked={!!form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} /><label className="form-check-label" htmlFor="active">{t("categories.modal.active", "Active")}</label></div></div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={closeCreateModal} disabled={saving}>{t("categories.modal.cancel", "Cancel")}</button><button type="submit" className="btn btn-dark" disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-2" />{t("categories.modal.saving", "Saving...")}</> : t("categories.modal.save", "Save")}</button></div></form></div></div></div><div className="modal-backdrop fade show" onClick={closeCreateModal} /></>}

      {deleteOpen && <><div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true"><div className="modal-dialog modal-dialog-centered"><div className="modal-content border-0 shadow"><div className="modal-header"><h5 className="modal-title">{t("categories.delete.title", "Confirmation")}</h5><button type="button" className="btn-close" onClick={() => setDeleteOpen(false)} disabled={deleting} /></div><div className="modal-body"><p className="mb-0">{t("categories.delete.message", "Delete category")} <b>{deleteTarget?.name}</b> ?</p><div className="text-muted small mt-2">{t("categories.manage.deleteWarning", "Warning: deletion may fail if the category contains subcategories or products.")}</div></div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>{t("categories.modal.cancel", "Cancel")}</button><button type="button" className="btn btn-danger" onClick={confirmDeleteCategory} disabled={deleting}>{deleting ? <><span className="spinner-border spinner-border-sm me-2" />{t("categories.delete.deleting", "Deleting...")}</> : t("categories.delete.btn", "Delete")}</button></div></div></div></div><div className="modal-backdrop fade show" /></>}
    </div>
  );
}
