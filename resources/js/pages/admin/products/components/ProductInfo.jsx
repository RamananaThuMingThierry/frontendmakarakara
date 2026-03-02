const DEFAULT_IMG = "/images/box.png";

function getUrl(img) {
  if (!img) return DEFAULT_IMG;
  return img.full_url || (img.url ? `/${img.url}` : DEFAULT_IMG);
}

export default function ProductInfo({ product }) {
  return (
    <>
      {/* left column: carousel */}
      <div className="col-12 col-lg-5">
        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex align-items-center justify-content-between">
            <div className="fw-semibold">Images du produit</div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm">
                <i className="bi bi-upload"></i> Ajouter
              </button>
              <button className="btn btn-outline-danger btn-sm">
                <i className="bi bi-trash"></i> Supprimer
              </button>
            </div>
          </div>
          <div className="card-body">
            <div id="productCarousel" className="carousel slide" data-bs-ride="carousel">
              <div className="carousel-inner rounded border bg-white">
                {(product.images || []).map((img, idx) => (
                  <div
                    className={`carousel-item ${idx === 0 ? "active" : ""}`}
                    key={idx}
                  >
                    <img
                      src={getUrl(img)}
                      className="d-block w-100"
                      alt={`Produit image ${idx + 1}`}
                      style={{ objectFit: "cover", maxHeight: "420px" }}
                    />
                  </div>
                ))}
              </div>
              <button
                className="carousel-control-prev"
                type="button"
                data-bs-target="#productCarousel"
                data-bs-slide="prev"
              >
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Précédent</span>
              </button>
              <button
                className="carousel-control-next"
                type="button"
                data-bs-target="#productCarousel"
                data-bs-slide="next"
              >
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Suivant</span>
              </button>
            </div>
            <div className="d-flex gap-2 mt-3 overflow-auto">
              {(product.images || []).map((img, idx) => (
                <img
                  key={idx}
                  className="rounded border"
                  src={getUrl(img)}
                  alt={`thumb${idx + 1}`}
                  style={{ width: 100, height: 80, objectFit: "cover" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* right column: summary */}
      <div className="col-12 col-lg-7">
        <div className="card shadow-sm h-100">
          <div className="card-header bg-white d-flex align-items-center justify-content-between">
            <div className="fw-semibold">Résumé</div>
            <span className="badge text-bg-warning py-2">
              Prix base: {product.price} MGA
            </span>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label text-muted small">Nom</label>
                <div className="form-control bg-light">{product.name}</div>
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label text-muted small">SKU</label>
                <div className="form-control bg-light">{product.sku || "-"}</div>
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label text-muted small">Statut</label>
                <div className="form-control bg-light">
                  {product.is_active ? "Actif" : "Inactif"}
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label text-muted small">Catégorie</label>
                <div className="form-control bg-light">
                  {product.category?.name || "-"}
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label text-muted small">Marque</label>
                <div className="form-control bg-light">
                  {product.brand?.name || "-"}
                </div>
              </div>
              <div className="col-12">
                <label className="form-label text-muted small">Description</label>
                <div className="form-control bg-light" style={{ minHeight: 110 }}>
                  {product.description || "-"}
                </div>
              </div>
            </div>
            <hr className="my-4" />
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="p-3 border rounded bg-white">
                  <div className="text-muted small">Stock total</div>
                  <div className="fs-4 fw-semibold">
                    100
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 border rounded bg-white">
                  <div className="text-muted small">Réservé</div>
                  <div className="fs-4 fw-semibold">
                    0
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 border rounded bg-white">
                  <div className="text-muted small">Villes associées</div>
                  <div className="fs-4 fw-semibold">
                    {product.cities?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
