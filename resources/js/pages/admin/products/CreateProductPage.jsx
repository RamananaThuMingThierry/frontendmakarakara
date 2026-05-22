import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { categoriesApi } from "../../../api/categories";
import TranslatedFileInput from "../../../Components/common/TranslatedFileInput";
import { productsApi } from "../../../api/products";
import { useI18n } from "../../../hooks/website/I18nContext";

export default function CreateProductPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryEncryptedId = searchParams.get("category_id") || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState(null);
  const [form, setForm] = useState({ name: "", sku: "", barcode: "", price: "", description: "", is_active: true });
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");

  const imagePreviews = useMemo(() => images.map((file) => ({ file, url: URL.createObjectURL(file) })), [images]);

  useEffect(() => () => imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url)), [imagePreviews]);
  useEffect(() => { loadCategory(); }, [categoryEncryptedId]);

  async function loadCategory() {
    setLoading(true);
    setGlobalError("");
    try {
      if (!categoryEncryptedId) {
        setGlobalError(t("products.errors.missingCategoryId", "Missing category_id in URL."));
        return;
      }
      const res = await categoriesApi.show(categoryEncryptedId);
      setCategory(res?.data ?? res);
    } catch (error) {
      setGlobalError(error?.response?.data?.message || t("products.errors.loadCategory", "Unable to load category."));
    } finally {
      setLoading(false);
    }
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function firstError(key) {
    const value = errors?.[key];
    return Array.isArray(value) ? value[0] : typeof value === "string" ? value : null;
  }

  function onPickImages(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    event.target.value = "";
    const maxBytes = 4 * 1024 * 1024;
    setImages((prev) => [...prev, ...files.filter((file) => file.type.startsWith("image/") && file.size <= maxBytes)]);
  }

  function removeImageAt(index) {
    setImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (saving) return;

    setErrors({});
    setGlobalError("");

    if (!form.name.trim()) {
      setErrors({ name: [t("products.errors.nameRequired", "Product name is required.")] });
      return;
    }
    if (!categoryEncryptedId) {
      setGlobalError(t("products.errors.missingCategoryId", "Missing category_id in URL."));
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name.trim());
    if (form.sku.trim()) formData.append("sku", form.sku.trim());
    if (form.barcode.trim()) formData.append("barcode", form.barcode.trim());
    if (form.price !== "") formData.append("price", String(Number(form.price)));
    if (form.description.trim()) formData.append("description", form.description.trim());
    formData.append("is_active", form.is_active ? "1" : "0");
    formData.append("category_id", categoryEncryptedId);
    images.forEach((file) => formData.append("images[]", file));

    setSaving(true);
    try {
      await productsApi.create(categoryEncryptedId, formData);
      navigate(`/admin/categories/${categoryEncryptedId}`);
    } catch (error) {
      const data = error?.response?.data;
      if (data?.errors) setErrors(data.errors);
      setGlobalError(data?.message || t("products.errors.createFailed", "Product creation failed."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="container-fluid"><div className="d-flex align-items-center gap-2 text-muted"><div className="spinner-border spinner-border-sm" />{t("products.loading", "Loading...")}</div></div>;
  }

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-1">{t("products.create.title", "Create product")}</h4>
          <div className="text-muted small">{t("products.fields.category", "Category")}: <b>{category?.name ?? "-"}</b></div>
        </div>
        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(`/admin/categories/${categoryEncryptedId}`)}><i className="bi bi-arrow-left me-2" />{t("common.back", "Back")}</button>
      </div>

      <div className="card border-0 shadow-sm"><div className="card-body">
        {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}
        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label className="form-label">{t("products.fields.category", "Category")}</label>
            <input className="form-control" value={category?.name ?? ""} disabled />
            <div className="form-text">{t("products.create.categoryFixed", "The category is set automatically.")}</div>
          </div>
          <div className="mb-3">
            <label className="form-label">{t("products.fields.name", "Product name")}</label>
            <input className={`form-control ${errors.name ? "is-invalid" : ""}`} value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder={t("products.placeholders.name", "Ex: Karting GT4 270cc")} autoFocus />
            {firstError("name") ? <div className="invalid-feedback">{firstError("name")}</div> : null}
          </div>
          <div className="row g-2">
            <div className="col-12 col-md-6"><div className="mb-3"><label className="form-label">SKU</label><input className={`form-control ${errors.sku ? "is-invalid" : ""}`} value={form.sku} onChange={(event) => setField("sku", event.target.value)} placeholder={t("products.placeholders.sku", "Ex: SKU-0001")} />{firstError("sku") ? <div className="invalid-feedback">{firstError("sku")}</div> : null}</div></div>
            <div className="col-12 col-md-6"><div className="mb-3"><label className="form-label">{t("products.fields.barcode", "Barcode")}</label><input className={`form-control ${errors.barcode ? "is-invalid" : ""}`} value={form.barcode} onChange={(event) => setField("barcode", event.target.value)} placeholder={t("products.placeholders.barcode", "Ex: 123456789")} />{firstError("barcode") ? <div className="invalid-feedback">{firstError("barcode")}</div> : null}</div></div>
          </div>
          <div className="mb-3">
            <label className="form-label">{t("products.fields.priceMga", "Price (MGA)")}</label>
            <input type="number" className={`form-control ${errors.price ? "is-invalid" : ""}`} value={form.price} onChange={(event) => setField("price", event.target.value)} placeholder={t("products.placeholders.price", "Ex: 25000")} min="0" step="1" />
            {firstError("price") ? <div className="invalid-feedback">{firstError("price")}</div> : null}
          </div>
          <div className="mb-3">
            <label className="form-label">{t("products.fields.description", "Description")}</label>
            <textarea className={`form-control ${errors.description ? "is-invalid" : ""}`} value={form.description} onChange={(event) => setField("description", event.target.value)} rows={4} />
            {firstError("description") ? <div className="invalid-feedback">{firstError("description")}</div> : null}
          </div>
          <div className="mb-3">
            <label className="form-label">{t("products.fields.images", "Images")}</label>
            <TranslatedFileInput accept="image/*" multiple error={firstError("images")} selectedText={images.length ? images.map((file) => file.name).join(", ") : ""} onChange={onPickImages} />
            
            {Object.keys(errors || {}).filter((key) => key.startsWith("images.")).slice(0, 3).map((key) => <div key={key} className="invalid-feedback d-block">{Array.isArray(errors[key]) ? errors[key][0] : errors[key]}</div>)}
            <div className="form-text">{t("products.fields.imagesHelp", "Formats: jpg, jpeg, png, webp. Max 4MB / image.")}</div>
            {imagePreviews.length ? <div className="mt-2 d-flex flex-wrap gap-2">{imagePreviews.map((preview, index) => <div key={preview.url} className="border rounded position-relative" style={{ width: 110, height: 110, overflow: "hidden" }}><img src={preview.url} alt={`preview-${index}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} /><button type="button" className="btn btn-sm btn-danger position-absolute" style={{ top: 6, right: 6 }} onClick={() => removeImageAt(index)} disabled={saving} title={t("products.actions.remove", "Remove")}><i className="bi bi-x-lg" /></button></div>)}</div> : null}
          </div>
          <div className="form-check mb-3"><input className="form-check-input" type="checkbox" id="active" checked={!!form.is_active} onChange={(event) => setField("is_active", event.target.checked)} /><label className="form-check-label" htmlFor="active">{t("products.fields.active", "Active")}</label></div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(`/admin/categories/${categoryEncryptedId}`)} disabled={saving}>{t("common.cancel", "Cancel")}</button>
            <button type="submit" className="btn btn-dark" disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-2" />{t("common.saving", "Saving...")}</> : t("products.actions.create", "Create")}</button>
          </div>
        </form>
      </div></div>
    </div>
  );
}
