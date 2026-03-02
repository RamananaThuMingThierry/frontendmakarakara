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
          {product.is_active ? (
            <span className="badge text-bg-success rounded-pill me-1"><i class="bi bi-check"></i>&nbsp;Actif</span>
          ) : (
            <span className="badge text-bg-secondary me-1">Inactif</span>
          )} • SKU: {product.sku || "-"} • Catégorie: {product.category?.name || "-"}
         </div>
      </div>
      <div className="d-flex gap-2">
        <button className="btn btn-outline-secondary btn-sm" type="button">
            <i className="bi bi-pencil"></i> Modifier
        </button>
        <button className="btn btn-outline-danger btn-sm" type="button">
            <i className="bi bi-archive"></i> Archiver
        </button>
      </div>
    </div>
  );
}
