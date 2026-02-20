const DEFAULT_IMG = "/images/box.png";

function getMain(product) {
  const img = product?.images?.[0];
  return img?.full_url || (img?.url ? `/${img.url}` : DEFAULT_IMG);
}

export default function ProductInfo({ product }) {
  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body row g-3">
        <div className="col-md-4">
          <img
            src={getMain(product)}
            className="w-100 rounded"
            style={{ height: 260, objectFit: "cover" }}
            onError={(e) => (e.currentTarget.src = DEFAULT_IMG)}
          />
        </div>

        <div className="col-md-8">
          <div className="row g-2">
            <div className="col-md-6">
              <div className="text-muted small">Prix</div>
              <div className="fw-bold">{product.price} MGA</div>
            </div>

            <div className="col-md-6">
              <div className="text-muted small">SKU</div>
              <div>{product.sku || "-"}</div>
            </div>

            <div className="col-md-6">
              <div className="text-muted small">Barcode</div>
              <div>{product.barcode || "-"}</div>
            </div>

            <div className="col-12">
              <div className="text-muted small">Description</div>
              <div>{product.description || "-"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}