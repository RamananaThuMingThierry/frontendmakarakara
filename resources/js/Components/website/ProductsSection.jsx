import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AddToCartToggle from "./AddToCartToggle";
import FavoriteButton from "./FavoriteButton";

function formatPriceMGA(value) {
  // simple format: 45000 -> "45 000 MGA"
  return `${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} MGA`;
}

function addToCart(item) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  const found = cart.find((p) => p.id === item.id);
  if (found) found.qty += item.qty;
  else cart.push(item);

  localStorage.setItem("cart", JSON.stringify(cart));
}


const CATEGORIES = [
  { key: "best", label: "Best sellers" },
  { key: "new", label: "Nouveautés" },
  { key: "soins", label: "Soins capillaires" },
  { key: "accessoires", label: "Accessoires" },
];

const SAMPLE_PRODUCTS = [
  {
    id: 1,
    name: "Set Accessoires Luxe",
    category: "accessoires",
    price: 45000,
    oldPrice: 52000,
    rating: 4.7,
    reviews: 128,
    badge: "-15%",
    image: "/website/products/p1.jpg",
  },
  {
    id: 2,
    name: "Sérum Boost & Brillance",
    category: "soins",
    price: 59000,
    oldPrice: null,
    rating: 4.8,
    reviews: 302,
    badge: "Nouveau",
    image: "/website/products/p2.jpg",
  },
  {
    id: 3,
    name: "Brosse Démêlante Pro",
    category: "accessoires",
    price: 38000,
    oldPrice: 42000,
    rating: 4.6,
    reviews: 89,
    badge: "Promo",
    image: "/website/products/p3.jpg",
  },
  {
    id: 4,
    name: "Masque Réparation Intense",
    category: "soins",
    price: 65000,
    oldPrice: 72000,
    rating: 4.9,
    reviews: 210,
    badge: "Best",
    image: "/website/products/p4.jpg",
  },
  // tu peux en ajouter...
];

function Stars({ value }) {
  // value ex: 4.7
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <span className="d-inline-flex align-items-center gap-1">
      {Array.from({ length: full }).map((_, i) => (
        <i key={`f${i}`} className="bi bi-star-fill text-warning"></i>
      ))}
      {half && <i className="bi bi-star-half text-warning"></i>}
      {Array.from({ length: empty }).map((_, i) => (
        <i key={`e${i}`} className="bi bi-star text-warning"></i>
      ))}
    </span>
  );
}

export default function ProductsSection() {
  const [active, setActive] = useState("best");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let list = SAMPLE_PRODUCTS;

    // logique "best/new" (exemple)
    if (active === "best") list = SAMPLE_PRODUCTS.slice(0, 4);
    else if (active === "new") list = SAMPLE_PRODUCTS.slice(1, 5);
    else list = SAMPLE_PRODUCTS.filter((p) => p.category === active);

    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(s));
    }
    return list;
  }, [active, q]);

  return (
    <section className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-2" style={{ fontFamily: "cursive" }}>
            Nos Produits
          </h2>
          <p className="text-secondary mb-0">
            Découvrez nos catégories et les produits les plus appréciés par nos clients.
          </p>
        </div>

        {/* Tabs + Search */}
        <div className="d-flex flex-column flex-lg-row align-items-center justify-content-between gap-3 mb-4">
          <ul className="nav nav-pills gap-2">
            {CATEGORIES.map((c) => (
              <li className="nav-item" key={c.key}>
                <button
                  className={"nav-link" + (active === c.key ? " active" : "")}
                  onClick={() => setActive(c.key)}
                  type="button"
                >
                  {c.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="input-group" style={{ maxWidth: 340 }}>
            <span className="input-group-text bg-white">
              <i className="bi bi-search"></i>
            </span>
            <input
              className="form-control"
              placeholder="Rechercher un produit…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        <div className="row g-4">
          {filtered.map((p) => (
            <div className="col-12 col-sm-6 col-lg-3" key={p.id}>
              <div className="card border-0 shadow-sm h-100">
                {/* Image */}
                <div className="position-relative">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="card-img-top"
                    style={{ height: 220, objectFit: "cover" }}
                    loading="lazy"
                  />
                  {p.badge && (
                    <span className="badge bg-dark position-absolute top-0 start-0 m-2">
                      {p.badge}
                    </span>
                  )}

                  <FavoriteButton
                    product={p}
                    className="position-absolute top-0 end-0 m-2"
                  />    
                </div>

                <div className="card-body d-flex flex-column">
                  {/* Category */}
                  <small className="text-uppercase text-secondary">
                    {p.category === "soins" ? "SOINS" : "ACCESSOIRES"}
                  </small>

                  <Link to={`/product/${p.id}`} className="text-decoration-none text-dark">
                    <h6 className="fw-semibold mt-1">{p.name}</h6>
                  </Link>

                  {/* Rating */}
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Stars value={p.rating} />
                    <small className="text-secondary">
                      {p.rating.toFixed(1)} ({p.reviews})
                    </small>
                  </div>

                  {/* Price */}
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div>
                      <div className="fw-bold text-danger">
                        {formatPriceMGA(p.price)}
                      </div>
                      {p.oldPrice && (
                        <small className="text-secondary text-decoration-line-through">
                          {formatPriceMGA(p.oldPrice)}
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-2">
                    <AddToCartToggle product={p} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-4">
          <Link className="btn btn-outline-dark btn-sm px-4" to="/shop">
            Voir tous les produits
          </Link>
        </div>
      </div>
    </section>
  );
}
