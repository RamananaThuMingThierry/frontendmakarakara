export default function ProductHeader({ product }) {
  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <div>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-1">
            <li className="breadcrumb-item">
              <a href="#" className="text-decoration-none">Produits</a>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Détail
            </li>
          </ol>
        </nav>
        <h3 className="mb-0">{product.name}</h3>
        <div className="text-muted small">
          SKU: {product.sku || "-"} • Catégorie: {product.category?.name || "-"} •{' '}
          {product.is_active ? (
            <span className="badge text-bg-success">Actif</span>
          ) : (
            <span className="badge text-bg-secondary">Inactif</span>
          )}
        </div>
      </div>
      <div className="d-flex gap-2">
        <button
          className="btn btn-primary"
          data-bs-toggle="modal"
          data-bs-target="#createMovementModal"
        >
          <i className="bi bi-plus-circle"></i> Nouveau mouvement
        </button>
      </div>
    </div>
  );
}