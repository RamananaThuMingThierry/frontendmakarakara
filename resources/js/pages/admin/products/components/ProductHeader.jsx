export default function ProductHeader({ product }) {
  return (
    <div className="d-flex align-items-center justify-content-between mb-3">
      <div>
        <h4 className="mb-1">{product.name}</h4>
        <div className="text-muted small">
          Catégorie: <b>{product.category?.name || "-"}</b>
        </div>
      </div>

      <div>
        {product.is_active ? (
          <span className="badge text-bg-success">Active</span>
        ) : (
          <span className="badge text-bg-secondary">Inactive</span>
        )}
      </div>
    </div>
  );
}