import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { categoriesApi } from "../../../api/categories";
import { productsApi } from "../../../api/products";
import { useI18n } from "../../../hooks/website/I18nContext";

export default function CreateProductPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // category_id = encrypted_id (comme tu as demandé)
  const categoryEncryptedId = searchParams.get("category_id") || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [category, setCategory] = useState(null);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    price: "",
    description: "",
    is_active: true,
  });

  // ✅ images sélectionnées
  const [images, setImages] = useState([]); // File[]
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");

  const imagePreviews = useMemo(() => {
    return images.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  useEffect(() => {
    // cleanup previews
    return () => {
      imagePreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagePreviews]);

  async function loadCategory() {
    setLoading(true);
    setGlobalError("");
    try {
      if (!categoryEncryptedId) {
        setGlobalError("category_id manquant dans l'URL");
        return;
      }
      const res = await categoriesApi.show(categoryEncryptedId);
      const c = res?.data ?? res;
      setCategory(c);
    } catch (e) {
      setGlobalError(e?.response?.data?.message || "Impossible de charger la catégorie");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryEncryptedId]);

  function setField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function firstError(key) {
    const v = errors?.[key];
    return Array.isArray(v) ? v[0] : typeof v === "string" ? v : null;
  }

  function onPickImages(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // reset input pour pouvoir re-sélectionner le même fichier
    e.target.value = "";

    // Optionnel : limite localement (Laravel: 2MB / image)
    const maxBytes = 2 * 1024 * 1024;

    const valid = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > maxBytes) continue;
      valid.push(f);
    }

    setImages((prev) => [...prev, ...valid]);
  }

  function removeImageAt(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (saving) return;

    setErrors({});
    setGlobalError("");

    if (!form.name.trim()) {
      setErrors({ name: ["Le nom est requis."] });
      return;
    }

    if (!categoryEncryptedId) {
      setGlobalError("category_id manquant dans l'URL");
      return;
    }

    // ✅ FormData pour envoyer images[]
    const fd = new FormData();
    fd.append("name", form.name.trim());
    if (form.sku.trim()) fd.append("sku", form.sku.trim());
    if (form.barcode.trim()) fd.append("barcode", form.barcode.trim());

    // price: Laravel attend numeric requis -> si vide, on n’envoie pas et Laravel renverra l’erreur
    if (form.price !== "") fd.append("price", String(Number(form.price)));

    if (form.description.trim()) fd.append("description", form.description.trim());
    fd.append("is_active", form.is_active ? "1" : "0");

    // ✅ IMPORTANT: category_id = encrypted id (comme ton URL)
    fd.append("category_id", categoryEncryptedId);

    // ✅ images[]
    images.forEach((file) => fd.append("images[]", file));

    setSaving(true);
    try {
      await productsApi.create(fd); // doit accepter FormData (voir note plus bas)

      // retour sur la page manage catégorie
      navigate(`/admin/categories/${categoryEncryptedId}`);
    } catch (e2) {
      const d = e2?.response?.data;

      // Laravel Validation: { message, errors: { field: [..] } }
      if (d?.errors) setErrors(d.errors);
      setGlobalError(d?.message || "Création échouée.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex align-items-center gap-2 text-muted">
          <div className="spinner-border spinner-border-sm" />
          {t("products.loading", "Loading...")}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-1">{t("products.create.title", "Create product")}</h4>
          <div className="text-muted small">
            Catégorie: <b>{category?.name ?? "—"}</b>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => navigate(`/admin/categories/${categoryEncryptedId}`)}
        >
          <i className="bi bi-arrow-left me-2" />
          {t("common.back", "Back")}
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}

          <form onSubmit={onSubmit}>
            {/* Category readonly */}
            <div className="mb-3">
              <label className="form-label">Catégorie</label>
              <input className="form-control" value={category?.name ?? ""} disabled />
              <div className="form-text">La catégorie est définie automatiquement.</div>
            </div>

            {/* Name */}
            <div className="mb-3">
              <label className="form-label">Nom du produit</label>
              <input
                className={`form-control ${errors.name ? "is-invalid" : ""}`}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Ex: Karting GT4 270cc"
                autoFocus
              />
              {firstError("name") ? <div className="invalid-feedback">{firstError("name")}</div> : null}
            </div>

            {/* SKU + Barcode */}
            <div className="row g-2">
              <div className="col-12 col-md-6">
                <div className="mb-3">
                  <label className="form-label">SKU</label>
                  <input
                    className={`form-control ${errors.sku ? "is-invalid" : ""}`}
                    value={form.sku}
                    onChange={(e) => setField("sku", e.target.value)}
                    placeholder="Ex: SKU-0001"
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
                    placeholder="Ex: 123456789"
                  />
                  {firstError("barcode") ? (
                    <div className="invalid-feedback">{firstError("barcode")}</div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="mb-3">
              <label className="form-label">Prix (MGA)</label>
              <input
                type="number"
                className={`form-control ${errors.price ? "is-invalid" : ""}`}
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                placeholder="Ex: 25000"
                min="0"
                step="1"
              />
              {firstError("price") ? <div className="invalid-feedback">{firstError("price")}</div> : null}
            </div>

            {/* Description */}
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                className={`form-control ${errors.description ? "is-invalid" : ""}`}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={4}
              />
              {firstError("description") ? (
                <div className="invalid-feedback">{firstError("description")}</div>
              ) : null}
            </div>

            {/* Images */}
            <div className="mb-3">
              <label className="form-label">Images</label>
              <input
                type="file"
                className={`form-control ${
                  errors.images || Object.keys(errors || {}).some((k) => k.startsWith("images.")) ? "is-invalid" : ""
                }`}
                accept="image/*"
                multiple
                onChange={onPickImages}
              />

              {/* erreur "images" (array) */}
              {firstError("images") ? <div className="invalid-feedback d-block">{firstError("images")}</div> : null}

              {/* erreurs "images.0", "images.1"... */}
              {Object.keys(errors || {})
                .filter((k) => k.startsWith("images."))
                .slice(0, 3)
                .map((k) => (
                  <div key={k} className="invalid-feedback d-block">
                    {Array.isArray(errors[k]) ? errors[k][0] : errors[k]}
                  </div>
                ))}

              <div className="form-text">Formats: jpg, jpeg, png, webp. Max 2MB / image.</div>

              {imagePreviews.length ? (
                <div className="mt-2 d-flex flex-wrap gap-2">
                  {imagePreviews.map((p, idx) => (
                    <div
                      key={p.url}
                      className="border rounded position-relative"
                      style={{ width: 110, height: 110, overflow: "hidden" }}
                    >
                      <img
                        src={p.url}
                        alt={`preview-${idx}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute"
                        style={{ top: 6, right: 6 }}
                        onClick={() => removeImageAt(idx)}
                        disabled={saving}
                        title="Retirer"
                      >
                        <i className="bi bi-x-lg" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Active */}
            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="active"
                checked={!!form.is_active}
                onChange={(e) => setField("is_active", e.target.checked)}
              />
              <label className="form-check-label" htmlFor="active">
                Active
              </label>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate(`/admin/categories/${categoryEncryptedId}`)}
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
                  "Créer"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}