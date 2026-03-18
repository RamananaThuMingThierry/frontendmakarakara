import { useNavigate, useParams } from "react-router-dom";

export default function ProductHeader({ product }) {
  const navigate = useNavigate();
  const { categoryId, productId } = useParams();

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <div>
        <h3 className="mb-0">{product.name}</h3>
        <div className="text-muted small">
          {product.is_active ? (
            <span className="badge text-bg-success rounded-pill me-1">
              <i className="bi bi-check" /> Actif
            </span>
          ) : (
            <span className="badge text-bg-secondary me-1">Inactif</span>
          )}{" "}
          · SKU: {product.sku || "-"} · Categorie: {product.category?.name || "-"}
        </div>
      </div>

      <div className="d-flex gap-2">
        <button
          className="btn btn-outline-secondary btn-sm"
          type="button"
          onClick={() => navigate(`/admin/categories/${categoryId}`)}
        >
          <i className="bi bi-arrow-left me-1" />
          Retour
        </button>
        <button
          className="btn btn-outline-primary btn-sm"
          type="button"
          onClick={() => navigate(`/admin/categories/${categoryId}/products/${productId}/edit`)}
        >
          <i className="bi bi-pencil me-1" />
          Modifier
        </button>
      </div>
    </div>
  );
}
