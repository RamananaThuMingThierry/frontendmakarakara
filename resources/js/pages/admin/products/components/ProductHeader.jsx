import { useNavigate, useParams } from "react-router-dom";
import { useI18n } from "../../../../hooks/website/I18nContext";

const routeId = (id) => encodeURIComponent(String(id ?? ""));

export default function ProductHeader({ product }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { categoryId, productId } = useParams();

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <div>
        <h3 className="mb-0">{product.name}</h3>
        <div className="text-muted small">
          {product.is_active ? (
            <span className="badge text-bg-success rounded-pill me-1">
              <i className="bi bi-check" /> {t("products.status.active", "Active")}
            </span>
          ) : (
            <span className="badge text-bg-secondary me-1">{t("products.status.inactive", "Inactive")}</span>
          )}{" "}
          | SKU: {product.sku || "-"} | {t("products.fields.category", "Category")}: {product.category?.name || "-"}
        </div>
      </div>

      <div className="d-flex gap-2">
        <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => navigate(`/admin/categories/${routeId(categoryId)}`)}>
          <i className="bi bi-arrow-left me-1" />
          {t("common.back", "Back")}
        </button>
        <button className="btn btn-outline-primary btn-sm" type="button" onClick={() => navigate(`/admin/categories/${routeId(categoryId)}/products/${routeId(productId)}/edit`)}>
          <i className="bi bi-pencil me-1" />
          {t("products.actions.edit", "Edit")}
        </button>
      </div>
    </div>
  );
}
