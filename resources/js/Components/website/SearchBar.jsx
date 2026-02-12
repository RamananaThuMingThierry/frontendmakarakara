import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function SearchBar({ products = [] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  const inputRef = useRef(null);
  const boxRef = useRef(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return products
      .filter((p) => (p.name || "").toLowerCase().includes(s))
      .slice(0, 8);
  }, [q, products]);

  // Focus input quand modal s'ouvre
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  // fermer suggestions quand clic dehors (dans la modal)
  useEffect(() => {
    const onClick = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) {
        // on ne ferme pas la modal ici, seulement le dropdown
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

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
      {/* ✅ Icon only */}
      <button
        type="button"
        className="btn btn-link btn-sm text-dark"
        onClick={() => setOpen(true)}
        aria-label="Rechercher"
        title="Rechercher"
      >
        <i className="bi bi-search" />
      </button>

      {/* ✅ Modal */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="modal-backdrop fade show" onClick={closeModal} />

          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 rounded-4 shadow">
                <div className="modal-header border-0">
                  <h5 className="modal-title fw-bold">Rechercher</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeModal}
                    aria-label="Fermer"
                  />
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
                        placeholder="Tapez le nom du produit…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                      />

                      <button className="btn btn-dark" type="submit">
                        Rechercher
                      </button>
                    </div>
                  </form>

                  {/* Suggestions */}
                  <div className="mt-3" ref={boxRef}>
                    {!q.trim() ? (
                      <div className="text-secondary small">
                        Astuce : essayez “Sérum”, “Masque”, “Brosse”…
                      </div>
                    ) : results.length > 0 ? (
                      <div className="list-group">
                        {results.map((p) => (
                          <Link
                            key={p.id}
                            to={`/product/${p.id}`}
                            className="list-group-item list-group-item-action d-flex align-items-center gap-3"
                            onClick={closeModal}
                          >
                            <img
                              src={p.image || "/images/placeholder-product.png"}
                              alt={p.name}
                              style={{ width: 44, height: 44, objectFit: "cover" }}
                              className="rounded"
                            />
                            <div className="flex-grow-1">
                              <div className="fw-semibold">{p.name}</div>
                              <div className="text-secondary small">
                                {p.category || "Produit"}
                              </div>
                            </div>
                            <i className="bi bi-arrow-up-right text-secondary" />
                          </Link>
                        ))}

                        <button
                          type="button"
                          className="list-group-item list-group-item-action text-center fw-semibold"
                          onClick={submit}
                        >
                          Voir tous les résultats
                        </button>
                      </div>
                    ) : (
                      <div className="alert alert-warning mb-0">
                        Aucun résultat pour “<span className="fw-semibold">{q}</span>”.
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
