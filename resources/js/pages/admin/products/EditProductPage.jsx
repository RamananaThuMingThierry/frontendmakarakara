import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { productsApi } from "../../../api/products";

function getImageUrl(image) {
  if (!image) return null;
  if (image.full_url) return image.full_url;
  if (image.url) return image.url.startsWith("http") ? image.url : `/${image.url}`;
  return null;
}

export default function EditProductPage() {
  const navigate = useNavigate();
  const { categoryId, productId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    price: "",
    description: "",
    is_active: true,
  });

  const imagePreviews = useMemo(() => {
    return images.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [images]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [imagePreviews]);

  useEffect(() => {
    loadProduct();
  }, [categoryId, productId]);

  async function loadProduct() {
    setLoading(true);
    setGlobalError("");

    try {
      const res = await productsApi.show(categoryId, productId);
      const data = res?.data ?? res;
      setProduct(data);
      setExistingImages(Array.isArray(data?.images) ? data.images : []);
      setDeletedImageIds([]);
      setForm({
        name: data?.name || "",
        sku: data?.sku || "",
        barcode: data?.barcode || "",
        price: data?.price ?? "",
        description: data?.description || "",
        is_active: !!data?.is_active,
      });
    } catch (e) {
      setGlobalError(e?.response?.data?.message || "Impossible de charger le produit.");
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

  function onPickImages(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    e.target.value = "";

    const maxBytes = 2 * 1024 * 1024;
    const valid = files.filter((file) => file.type.startsWith("image/") && file.size <= maxBytes);
    setImages((prev) => [...prev, ...valid]);
  }

  function removeImageAt(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function removeExistingImage(imageId) {
    setDeletedImageIds((prev) => (prev.includes(imageId) ? prev : [...prev, imageId]));
    setExistingImages((prev) => prev.filter((image) => image.id !== imageId));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (saving) return;

    setErrors({});
    setGlobalError("");

    const fd = new FormData();
    fd.append("name", form.name.trim());
    if (form.sku.trim()) fd.append("sku", form.sku.trim());
    if (form.barcode.trim()) fd.append("barcode", form.barcode.trim());
    if (form.price !== "") fd.append("price", String(Number(form.price)));
    if (form.description.trim()) fd.append("description", form.description.trim());
    fd.append("is_active", form.is_active ? "1" : "0");
    fd.append("deleted_image_ids", JSON.stringify(deletedImageIds));
    images.forEach((file) => fd.append("images[]", file));

    setSaving(true);
    try {
      await productsApi.update(categoryId, productId, fd);
      navigate(`/admin/categories/${categoryId}/products/${productId}`);
    } catch (e) {
      const data = e?.response?.data;
      if (data?.errors) setErrors(data.errors);
      setGlobalError(data?.message || "Modification echouee.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex align-items-center gap-2 text-muted">
          <div className="spinner-border spinner-border-sm" />
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-1">Modifier le produit</h4>
          <div className="text-muted small">
            Categorie: <b>{product?.category?.name ?? "-"}</b>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => navigate(`/admin/categories/${categoryId}/products/${productId}`)}
        >
          <i className="bi bi-arrow-left me-2" />
          Retour
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}

          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="form-label">Nom du produit</label>
              <input
                className={`form-control ${errors.name ? "is-invalid" : ""}`}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                autoFocus
              />
              {firstError("name") ? <div className="invalid-feedback">{firstError("name")}</div> : null}
            </div>

            <div className="row g-2">
              <div className="col-12 col-md-6">
                <div className="mb-3">
                  <label className="form-label">SKU</label>
                  <input
                    className={`form-control ${errors.sku ? "is-invalid" : ""}`}
                    value={form.sku}
                    onChange={(e) => setField("sku", e.target.value)}
                  />
                  {firstError("sku") ? <div className="invalid-feedback">{firstError("sku")}</div> : null}
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="mb-3">
                  <label className="form-label">Barcode</label>
                  <input
                    className={`form-control ${errors.barcode ? "is-invalid" : ""}`}
                    value={form.barcode}
                    onChange={(e) => setField("barcode", e.target.value)}
                  />
                  {firstError("barcode") ? <div className="invalid-feedback">{firstError("barcode")}</div> : null}
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Prix (MGA)</label>
              <input
                type="number"
                className={`form-control ${errors.price ? "is-invalid" : ""}`}
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                min="0"
                step="1"
              />
              {firstError("price") ? <div className="invalid-feedback">{firstError("price")}</div> : null}
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                className={`form-control ${errors.description ? "is-invalid" : ""}`}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={4}
              />
              {firstError("description") ? <div className="invalid-feedback">{firstError("description")}</div> : null}
            </div>

            <div className="mb-3">
              <label className="form-label">Images existantes</label>
              {existingImages.length ? (
                <div className="d-flex flex-wrap gap-2">
                  {existingImages.map((image) => (
                    <div
                      key={image.id}
                      className="border rounded position-relative"
                      style={{ width: 110, height: 110, overflow: "hidden" }}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={image.alt || product?.name || "Produit"}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute"
                        style={{ top: 6, right: 6 }}
                        onClick={() => removeExistingImage(image.id)}
                        disabled={saving}
                      >
                        <i className="bi bi-x-lg" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted small">Aucune image conservee.</div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Ajouter des images</label>
              <input
                type="file"
                className={`form-control ${
                  errors.images || Object.keys(errors || {}).some((key) => key.startsWith("images.")) ? "is-invalid" : ""
                }`}
                accept="image/*"
                multiple
                onChange={onPickImages}
              />
              {firstError("images") ? <div className="invalid-feedback d-block">{firstError("images")}</div> : null}
              {Object.keys(errors || {})
                .filter((key) => key.startsWith("images."))
                .slice(0, 3)
                .map((key) => (
                  <div key={key} className="invalid-feedback d-block">
                    {Array.isArray(errors[key]) ? errors[key][0] : errors[key]}
                  </div>
                ))}

              {imagePreviews.length ? (
                <div className="mt-2 d-flex flex-wrap gap-2">
                  {imagePreviews.map((preview, idx) => (
                    <div
                      key={preview.url}
                      className="border rounded position-relative"
                      style={{ width: 110, height: 110, overflow: "hidden" }}
                    >
                      <img
                        src={preview.url}
                        alt={`preview-${idx}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute"
                        style={{ top: 6, right: 6 }}
                        onClick={() => removeImageAt(idx)}
                        disabled={saving}
                      >
                        <i className="bi bi-x-lg" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="product-active"
                checked={!!form.is_active}
                onChange={(e) => setField("is_active", e.target.checked)}
              />
              <label className="form-check-label" htmlFor="product-active">
                Active
              </label>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate(`/admin/categories/${categoryId}/products/${productId}`)}
                disabled={saving}
              >
                Annuler
              </button>

              <button type="submit" className="btn btn-dark" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Enregistrement...
                  </>
                ) : (
                  "Mettre a jour"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
