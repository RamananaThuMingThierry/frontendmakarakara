import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { inventoryApi } from "../../api/inventories";

const DEFAULT_IMAGE = "/images/box.png";

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

export default function SearchBar() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const inputRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!open || loadedRef.current) return;

    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        const data = await inventoryApi.shopList();
        if (cancelled) return;

        const grouped = new Map();
        (Array.isArray(data) ? data : []).forEach((inventory) => {
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

          if (!grouped.has(product.id)) {
            grouped.set(product.id, {
              id: product.id,
              product_encrypted_id: product.encrypted_id || null,
              name: product.name || "Produit",
              category_name: product?.category?.name || "Produit",
              image: getProductImage(product),
            });
          }
        });

        setProducts(Array.from(grouped.values()));
        loadedRef.current = true;
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  const results = useMemo(() => {
    const s = normalizeText(q);
    if (!s) return [];

    return products
      .filter((p) => normalizeText(p.name).includes(s) || normalizeText(p.category_name).includes(s))
      .slice(0, 8);
  }, [q, products]);

  const closeModal = () => {
    setOpen(false);
  };

  const submit = (e) => {
    e?.preventDefault?.();
    const s = q.trim();
    if (!s) return;
    closeModal();
    nav(`/search?q=${encodeURIComponent(s)}`);
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-link btn-sm text-dark"
        onClick={() => setOpen(true)}
        aria-label="Rechercher"
        title="Rechercher"
      >
        <i className="bi bi-search" />
      </button>

      {open && (
        <>
          <div className="modal-backdrop fade show" onClick={closeModal} />

          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 rounded-4 shadow">
                <div className="modal-header border-0">
                  <h5 className="modal-title fw-bold">Rechercher</h5>
                  <button type="button" className="btn-close" onClick={closeModal} aria-label="Fermer" />
                </div>

                <div className="modal-body pt-0">
                  <form onSubmit={submit}>
                    <div className="input-group">
                      <span className="input-group-text bg-white">
                        <i className="bi bi-search" />
                      </span>

                      <input
                        ref={inputRef}
                        className="form-control"
                        placeholder="Tapez le nom du produit..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                      />

                      <button className="btn btn-dark" type="submit">
                        Rechercher
                      </button>
                    </div>
                  </form>

                  <div className="mt-3">
                    {loading ? (
                      <div className="text-secondary small">Chargement des suggestions...</div>
                    ) : !q.trim() ? (
                      <div className="text-secondary small">
                        Astuce : essayez "Serum", "Masque", "Brosse"...
                      </div>
                    ) : results.length > 0 ? (
                      <div className="list-group">
                        {results.map((p) => (
                          <Link
                            key={p.id}
                            to={`/product/${p.product_encrypted_id}`}
                            className="list-group-item list-group-item-action d-flex align-items-center gap-3"
                            onClick={closeModal}
                          >
                            <img
                              src={p.image}
                              alt={p.name}
                              style={{ width: 44, height: 44, objectFit: "cover" }}
                              className="rounded"
                            />
                            <div className="flex-grow-1">
                              <div className="fw-semibold">{p.name}</div>
                              <div className="text-secondary small">{p.category_name}</div>
                            </div>
                            <i className="bi bi-arrow-up-right text-secondary" />
                          </Link>
                        ))}

                        <button
                          type="button"
                          className="list-group-item list-group-item-action text-center fw-semibold"
                          onClick={submit}
                        >
                          Voir tous les resultats
                        </button>
                      </div>
                    ) : (
                      <div className="alert alert-warning mb-0">
                        Aucun resultat pour "<span className="fw-semibold">{q}</span>".
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer border-0">
                  <button className="btn btn-sm btn-outline-dark" onClick={closeModal} type="button">
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
