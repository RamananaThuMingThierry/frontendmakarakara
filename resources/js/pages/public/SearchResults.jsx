import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { inventoryApi } from "../../api/inventories";

const DEFAULT_IMAGE = "/images/box.png";

function formatPriceMGA(value) {
  return `${Number(value || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} MGA`;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getProductImage(product) {
  const image = product?.images?.[0];
  return image?.full_url || (image?.url ? `/${image.url}` : DEFAULT_IMAGE);
}

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await inventoryApi.shopList();
        if (cancelled) return;
        setInventories(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelled) return;
        setError(err?.response?.data?.message || "Impossible de charger les produits.");
        setInventories([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const products = useMemo(() => {
    const grouped = new Map();

    inventories.forEach((inventory) => {
      const product = inventory?.product;
      const city = inventory?.city;

      if (
        !product?.id ||
        inventory?.is_available !== true ||
        product?.is_active !== true ||
        city?.is_active !== true
      ) {
        return;
      }

      const current = grouped.get(product.id);
      const mapped = {
        id: product.id,
        product_encrypted_id: product.encrypted_id || null,
        name: product.name || "Produit",
        category_name: product?.category?.name || "Produit",
        price: Number(inventory?.price ?? product?.price ?? 0),
        compare_price: Number(inventory?.compare_price ?? product?.compare_price ?? 0),
        image: getProductImage(product),
      };

      if (!current || mapped.price < current.price) {
        grouped.set(product.id, mapped);
      }
    });

    return Array.from(grouped.values());
  }, [inventories]);

  const results = useMemo(() => {
    if (!q) return [];
    const s = normalizeText(q);
    return products.filter(
      (p) => normalizeText(p.name).includes(s) || normalizeText(p.category_name).includes(s)
    );
  }, [q, products]);

  return (
    <main className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        <div className="mb-4">
          <h1 className="fw-bold mb-1">Recherche</h1>
          <p className="text-secondary mb-0">
            Resultats pour : <span className="fw-semibold">{q || "-"}</span>
          </p>
        </div>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        {loading ? (
          <div className="alert alert-light mb-0">Chargement des produits...</div>
        ) : !q ? (
          <div className="alert alert-warning mb-0">Entrez un mot-cle pour rechercher un produit.</div>
        ) : results.length === 0 ? (
          <div className="text-center py-5">
            <img
              src="/images/empty-search.png"
              alt="Aucun resultat"
              className="img-fluid mb-4"
              style={{ maxWidth: 260, opacity: 0.9 }}
            />
            <h5 className="fw-semibold">Aucun resultat</h5>
            <p className="text-muted">Essayez un autre mot-cle ou consultez la boutique.</p>
            <Link to="/shop" className="btn btn-dark">
              Aller a la boutique
            </Link>
          </div>
        ) : (
          <>
            <div className="text-secondary small mb-3">{results.length} resultat(s)</div>

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
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_IMAGE;
                      }}
                    />

                    <div className="card-body d-flex flex-column">
                      <small className="text-uppercase text-secondary">{p.category_name}</small>

                      <Link to={`/product/${p.product_encrypted_id}`} className="text-decoration-none text-dark">
                        <h6 className="fw-semibold mt-1">{p.name}</h6>
                      </Link>

                      <div className="mt-auto d-flex justify-content-between align-items-center">
                        <div className="fw-bold text-danger">{formatPriceMGA(p.price)}</div>
                        <Link to={`/product/${p.product_encrypted_id}`} className="btn btn-dark btn-sm">
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
