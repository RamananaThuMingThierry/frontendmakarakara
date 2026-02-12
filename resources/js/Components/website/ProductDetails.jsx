import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AddToCartToggle from "./AddToCartToggle";

function formatPriceMGA(value) {
  return `${Number(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} MGA`;
}

/** Exemple data (à remplacer par ton API Laravel) */
const PRODUCTS = [
  {
    id: 1,
    name: "Set Accessoires Luxe",
    price: 45000,
    oldPrice: 52000,
    description:
      "Un pack premium d’accessoires capillaires pour un style impeccable au quotidien.",
    brand: { id: 1, name: "MAHAKARAKARA" },
    categories: ["Accessoires", "Best sellers"],
    cities: ["Antananarivo", "Antalaha", "Diego-Suerez"],
    images: [
      "/website/products/p1.jpg",
      "/website/products/p2.jpg",
      "/website/products/p3.jpg",
      "/website/products/p4.jpg",
    ],
  },
];

export default function ProductDetails() {
  const { id } = useParams();

  const product = useMemo(
    () => PRODUCTS.find((p) => String(p.id) === String(id)),
    [id]
  );

  const images = product?.images?.length ? product.images : ["/images/placeholder-product.png"];
  const [activeIndex, setActiveIndex] = useState(0);

  if (!product) {
    return (
      <div className="container py-5 text-center">
        <img
          src="/images/rejected.png"
          alt="Produit introuvable"
          className="img-fluid mb-4"
          style={{ maxWidth: 250, opacity: 0.9 }}
        />

        <h5 className="fw-semibold">Produit introuvable</h5>
        <p className="text-muted">Ce produit n'existe plus ou a été supprimé.</p>

        <Link to="/shop" className="btn btn-primary mt-3">
          Voir les autres produits
        </Link>
      </div>
    );
  }

  return (
    <main className="py-4 py-lg-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        <div className="row g-4">
          {/* GALLERY */}
          <div className="col-12 col-lg-7">
            <div className="row g-3">
              {/* Thumbnails */}
              <div className="col-3">
                <div className="d-flex flex-column gap-2">
                  {images.map((src, idx) => (
                    <button
                      key={`${src}-${idx}`}
                      type="button"
                      className={
                        "border rounded-3 p-0 overflow-hidden bg-white " +
                        (idx === activeIndex ? "border-dark" : "border-light")
                      }
                      onClick={() => setActiveIndex(idx)}
                      style={{ aspectRatio: "1 / 1" }}
                      aria-label={`Voir image ${idx + 1}`}
                    >
                      <img
                        src={src}
                        alt={`${product.name} ${idx + 1}`}
                        className="w-100 h-100"
                        style={{ objectFit: "cover" }}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Big preview */}
              <div className="col-9">
                <div className="bg-white rounded-4 shadow-sm overflow-hidden">
                  <img
                    src={images[activeIndex]}
                    alt={`${product.name} principale`}
                    className="w-100"
                    style={{ height: 500, objectFit: "cover" }}
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* INFO PRODUIT */}
          <div className="col-12 col-lg-5">
            <div className="bg-white rounded-4 shadow-sm p-4">
              <h1 className="h3 fw-bold mb-2">{product.name}</h1>

              {/* Brand */}
              <div className="mb-2">
                <span className="text-secondary">Marque :</span>{" "}
                <span className="fw-semibold">{product.brand?.name}</span>
              </div>

              {/* Categories */}
              <div className="mb-3 d-flex flex-wrap gap-2">
                {product.categories?.map((c) => (
                  <span key={c} className="badge text-bg-light border">
                    {c}
                  </span>
                ))}
              </div>

              {/* Cities */}
              <div className="mb-3">
                <div className="text-secondary mb-1">Disponible dans :</div>
                <div className="d-flex flex-wrap gap-2">
                  {product.cities?.map((city) => (
                    <span key={city} className="badge bg-dark">
                      {city}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="mb-3">
                <div className="h4 fw-bold text-danger mb-1">
                  {formatPriceMGA(product.price)}
                </div>
                {product.oldPrice && (
                  <div className="text-secondary text-decoration-line-through">
                    {formatPriceMGA(product.oldPrice)}
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-secondary">{product.description}</p>

              {/* Actions */}
              <div className="d-grid gap-2">
                <AddToCartToggle product={product} />

                <button className="btn btn-outline-dark" type="button">
                  <i className="bi bi-heart me-2" />
                  Ajouter aux favoris
                </button>
              </div>

              <hr />

              {/* Extra info */}
              <ul className="list-unstyled text-secondary small mb-0">
                <li className="mb-1">
                  <i className="bi bi-shield-check me-2 text-warning" />
                  Qualité garantie
                </li>
                <li className="mb-1">
                  <i className="bi bi-truck me-2 text-warning" />
                  Livraison rapide
                </li>
                <li>
                  <i className="bi bi-arrow-counterclockwise me-2 text-warning" />
                  Retour facile 30 jours
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
