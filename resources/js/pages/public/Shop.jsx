import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AddToCartToggle from "../../Components/website/AddToCartToggle";
import { PRODUCTS } from "../../data/products";

function formatPriceMGA(value) {
  return `${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} MGA`;
}

const CATEGORIES = [
  { key: "all", label: "Toutes" },
  { key: "soins", label: "Soins capillaires" },
  { key: "accessoires", label: "Accessoires" },
  { key: "packs", label: "Packs" },
];


function Stars({ value }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <span className="d-inline-flex align-items-center gap-1">
      {Array.from({ length: full }).map((_, i) => (
        <i key={`f${i}`} className="bi bi-star-fill text-warning" />
      ))}
      {half && <i className="bi bi-star-half text-warning" />}
      {Array.from({ length: empty }).map((_, i) => (
        <i key={`e${i}`} className="bi bi-star text-warning" />
      ))}
    </span>
  );
}

export default function Shop() {
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("popular"); // popular | priceAsc | priceDesc | name
  const [page, setPage] = useState(1);
  const perPage = 8;

  const filtered = useMemo(() => {
    let list = PRODUCTS;

    // filter category
    if (category !== "all") {
      list = list.filter((p) => p.category === category);
    }

    // search
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(s));
    }

    // sort
    if (sort === "priceAsc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "priceDesc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "popular") list = [...list].sort((a, b) => b.rating - a.rating);

    return list;
  }, [category, q, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const changeCategory = (c) => {
    setCategory(c);
    setPage(1);
  };

  return (
    <main className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">

        {/* Header */}
        <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3 mb-4">
          <div>
            <h1 className="fw-bold mb-1">Boutique</h1>
            <p className="text-secondary mb-0">
              Trouvez rapidement le produit idéal selon la catégorie.
            </p>
          </div>

          <div className="d-flex flex-column flex-sm-row gap-2">
            <div className="input-group" style={{ minWidth: 260 }}>
              <span className="input-group-text bg-white">
                <i className="bi bi-search" />
              </span>
              <input
                className="form-control"
                placeholder="Rechercher…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <select
              className="form-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{ minWidth: 220 }}
            >
              <option value="popular">Trier : Popularité</option>
              <option value="priceAsc">Prix : croissant</option>
              <option value="priceDesc">Prix : décroissant</option>
              <option value="name">Nom : A → Z</option>
            </select>
          </div>
        </div>

        {/* Category pills */}
        <div className="d-flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              className={"btn btn-sm " + (category === c.key ? "btn-dark" : "btn-outline-dark")}
              onClick={() => changeCategory(c.key)}
              type="button"
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Result count */}
        <div className="text-secondary small mb-3">
          {filtered.length} produit(s) • Page {page}/{totalPages}
        </div>

        {/* Products grid */}
        <div className="row g-4">
          {paginated.map((p) => (
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
                    {p.category}
                  </small>

                  <Link to={`/product/${p.id}`} className="text-decoration-none text-dark">
                    <h6 className="fw-semibold mt-1">{p.name}</h6>
                  </Link>

                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Stars value={p.rating} />
                    <small className="text-secondary">{p.rating.toFixed(1)}</small>
                  </div>

                  <div className="mt-auto d-flex align-items-center justify-content-between">
                    <div className="fw-bold text-danger">
                      {formatPriceMGA(p.price)}
                    </div>

                  </div>
 
                  <div className="mt-auto pt-2">
                    <AddToCartToggle product={p} variant="compact" />
                  </div>
 
                </div>
              </div>
            </div>
          ))}

          {paginated.length === 0 && (
            <div className="col-12">
              <div className="alert alert-warning mb-0">
                Aucun produit trouvé avec ces critères.
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-4">
            <ul className="pagination justify-content-center">
              <li className={"page-item " + (page === 1 ? "disabled" : "")}>
                <button className="page-link" onClick={() => setPage((p) => p - 1)}>
                  Précédent
                </button>
              </li>

              {Array.from({ length: totalPages }).map((_, i) => {
                const n = i + 1;
                return (
                  <li className={"page-item " + (page === n ? "active" : "")} key={n}>
                    <button className="page-link" onClick={() => setPage(n)}>
                      {n}
                    </button>
                  </li>
                );
              })}

              <li className={"page-item " + (page === totalPages ? "disabled" : "")}>
                <button className="page-link" onClick={() => setPage((p) => p + 1)}>
                  Suivant
                </button>
              </li>
            </ul>
          </nav>
        )}

      </div>
    </main>
  );
}
