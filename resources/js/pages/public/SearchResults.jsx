import { Link, useSearchParams } from "react-router-dom";
import { useMemo } from "react";

import { PRODUCTS } from "../../data/products";

function formatPriceMGA(value) {
  return `${Number(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} MGA`;
}

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();

  const results = useMemo(() => {
    if (!q) return [];
    const s = q.toLowerCase();
    return PRODUCTS.filter((p) => (p.name || "").toLowerCase().includes(s));
  }, [q]);

  return (
    <main className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        <div className="mb-4">
          <h1 className="fw-bold mb-1">Recherche</h1>
          <p className="text-secondary mb-0">
            Résultats pour : <span className="fw-semibold">{q || "—"}</span>
          </p>
        </div>

        {!q ? (
          <div className="alert alert-warning mb-0">
            Entrez un mot-clé pour rechercher un produit.
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-5">
            <img
              src="/images/empty-search.png"
              alt="Aucun résultat"
              className="img-fluid mb-4"
              style={{ maxWidth: 260, opacity: 0.9 }}
            />
            <h5 className="fw-semibold">Aucun résultat</h5>
            <p className="text-muted">
              Essayez un autre mot-clé ou consultez la boutique.
            </p>
            <Link to="/shop" className="btn btn-dark">
              Aller à la boutique
            </Link>
          </div>
        ) : (
          <>
            <div className="text-secondary small mb-3">
              {results.length} résultat(s)
            </div>

            <div className="row g-4">
              {results.map((p) => (
                <div className="col-12 col-sm-6 col-lg-3" key={p.id}>
                  <div className="card border-0 shadow-sm h-100">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="card-img-top"
                      style={{ height: 220, objectFit: "cover" }}
                      loading="lazy"
                    />

                    <div className="card-body d-flex flex-column">
                      <small className="text-uppercase text-secondary">
                        {p.category || "PRODUIT"}
                      </small>

                      <Link
                        to={`/product/${p.id}`}
                        className="text-decoration-none text-dark"
                      >
                        <h6 className="fw-semibold mt-1">{p.name}</h6>
                      </Link>

                      <div className="mt-auto d-flex justify-content-between align-items-center">
                        <div className="fw-bold text-danger">
                          {formatPriceMGA(p.price)}
                        </div>
                        <Link to={`/product/${p.id}`} className="btn btn-dark btn-sm">
                          Voir
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
