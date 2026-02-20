import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { categoriesApi } from "../../../api/categories";
import { useI18n } from "../../../hooks/website/I18nContext";

export default function UpdateCategoryPage() {
  const { encryptedId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [category, setCategory] = useState(null);

  const [form, setForm] = useState({
    name: "",
    is_active: true,
  });

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");

  async function load() {
    setLoading(true);
    setGlobalError("");
    try {
      const res = await categoriesApi.show(encryptedId);
      const c = res?.data ?? res;

      setCategory(c);
      setForm({
        name: c?.name ?? "",
        is_active: !!c?.is_active,
      });
    } catch (e) {
      setGlobalError(e?.response?.data?.message || t("categories.edit.loadFailed", "Load failed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encryptedId]);

  async function onSubmit(e) {
    e.preventDefault();
    if (saving) return;

    setErrors({});
    setGlobalError("");

    if (!form.name.trim()) {
      setErrors({ name: [t("categories.toast.nameRequired", "Name is required")] });
      return;
    }

    const payload = {
      name: form.name.trim(),
      is_active: !!form.is_active,
    };

    setSaving(true);
    try {
      await categoriesApi.update(encryptedId, payload);

      // après update -> retourner à la page manage
      navigate(`/admin/categories/${encryptedId}`);
    } catch (e2) {
      const d = e2?.response?.data;
      if (d?.errors) setErrors(d.errors);
      else setGlobalError(d?.message || t("categories.edit.saveFailed", "Save failed"));
    } finally {
      setSaving(false);
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

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-1">{t("categories.edit.title", "Update category")}</h4>
          <div className="text-muted small">
            {category ? `${category.name} (${category.slug})` : ""}
          </div>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => navigate(`/admin/categories/${encryptedId}`)}
        >
          <i className="bi bi-arrow-left me-2" />
          {t("common.back", "Back")}
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}

          {/* Parent (lecture seule) */}
          <div className="mb-3">
            <label className="form-label">{t("categories.modal.parent", "Parent")}</label>
            <input
              className="form-control"
              value={category?.parent?.name ?? "—"}
              disabled
            />
            <div className="form-text">
              {t("categories.edit.parentFixed", "Parent is fixed from this page")}
            </div>
          </div>

          <form onSubmit={onSubmit}>
            {/* Name */}
            <div className="mb-3">
              <label className="form-label">{t("categories.modal.name", "Name")}</label>
              <input
                className={`form-control ${errors.name ? "is-invalid" : ""}`}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
              {errors.name ? <div className="invalid-feedback">{errors.name[0]}</div> : null}
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
                {t("categories.modal.active", "Active")}
              </label>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate(`/admin/categories/${encryptedId}`)}
                disabled={saving}
              >
                {t("categories.modal.cancel", "Cancel")}
              </button>

              <button type="submit" className="btn btn-dark" disabled={saving}>
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
  );
}