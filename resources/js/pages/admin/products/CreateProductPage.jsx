import React, { useEffect, useState } from "react";
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

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");

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

  async function onSubmit(e) {
    e.preventDefault();
    if (saving) return;

    setErrors({});
    setGlobalError("");

    if (!form.name.trim()) {
      setErrors({ name: ["Le nom est requis."] });
      return;
    }

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      barcode: form.barcode.trim() || null,
      price: form.price === "" ? null : Number(form.price),
      description: form.description.trim() || null,
      is_active: !!form.is_active,

      // ✅ IMPORTANT: on envoie category_id = encrypted id (comme ton URL)
      category_id: categoryEncryptedId,
    };

    setSaving(true);
    try {
      await productsApi.create(payload);

      // retour sur la page manage catégorie
      navigate(`/admin/categories/${categoryEncryptedId}`);
    } catch (e2) {
      const d = e2?.response?.data;
      if (d?.errors) setErrors(d.errors);
      else setGlobalError(d?.message || "Création échouée.");
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
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Karting GT4 270cc"
                autoFocus
              />
              {errors.name ? <div className="invalid-feedback">{errors.name[0]}</div> : null}
            </div>

            {/* SKU + Barcode */}
            <div className="row g-2">
              <div className="col-12 col-md-6">
                <div className="mb-3">
                  <label className="form-label">SKU</label>
                  <input
                    className={`form-control ${errors.sku ? "is-invalid" : ""}`}
                    value={form.sku}
                    onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                    placeholder="Ex: SKU-0001"
                  />
                  {errors.sku ? <div className="invalid-feedback">{errors.sku[0]}</div> : null}
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="mb-3">
                  <label className="form-label">Barcode</label>
                  <input
                    className={`form-control ${errors.barcode ? "is-invalid" : ""}`}
                    value={form.barcode}
                    onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))}
                    placeholder="Ex: 123456789"
                  />
                  {errors.barcode ? <div className="invalid-feedback">{errors.barcode[0]}</div> : null}
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
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="Ex: 25000"
              />
              {errors.price ? <div className="invalid-feedback">{errors.price[0]}</div> : null}
            </div>

            {/* Description */}
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                className={`form-control ${errors.description ? "is-invalid" : ""}`}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
              />
              {errors.description ? <div className="invalid-feedback">{errors.description[0]}</div> : null}
            </div>

            {/* Active */}
            <div className="form-check mb-3">
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