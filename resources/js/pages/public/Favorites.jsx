import { Link } from "react-router-dom";
import { useFavorites } from "../../hooks/website/FavoritesContext";

function formatPriceMGA(value) {
  return `${Number(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} MGA`;
}

export default function Favorites() {
  const { favorites, favCount, removeFav, clearFav } = useFavorites();

  if (!favCount) {
    return (
      <div className="container py-5 text-center">
        <img
          src="/images/empty-favorites.png"
          alt="Favoris vides"
          className="img-fluid mb-4"
          style={{ maxWidth: 260, opacity: 0.9 }}
        />
        <h5 className="fw-semibold">Aucun favori pour l’instant</h5>
        <p className="text-muted">
          Ajoutez des produits en cliquant sur le cœur ❤️
        </p>
        <Link to="/shop" className="btn btn-dark">
          Aller à la boutique
        </Link>
      </div>
    );
  }

  return (
    <main className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
          <div>
            <h1 className="fw-bold mb-1">Favoris</h1>
            <p className="text-secondary mb-0">{favCount} produit(s)</p>
          </div>

          <button className="btn btn-outline-danger" onClick={clearFav} type="button">
            <i className="bi bi-trash me-2" />
            Vider
          </button>
        </div>

        <div className="row g-4">
          {favorites.map((p) => (
            <div key={p.id} className="col-12 col-sm-6 col-lg-3">
              <div className="card border-0 shadow-sm h-100">
                <img
                  src={p.image || "/images/placeholder-product.png"}
                  alt={p.name}
                  className="card-img-top"
                  style={{ height: 220, objectFit: "cover" }}
                />

                <div className="card-body d-flex flex-column">
                  <small className="text-uppercase text-secondary">{p.category || "PRODUIT"}</small>

                  <Link to={`/product/${p.id}`} className="text-decoration-none text-dark">
                    <h6 className="fw-semibold mt-1">{p.name}</h6>
                  </Link>

                  <div className="mt-auto d-flex align-items-center justify-content-between gap-2">
                    <div className="fw-bold text-danger">{formatPriceMGA(p.price)}</div>

                    <button
                      className="btn btn-outline-danger btn-sm"
                      type="button"
                      onClick={() => removeFav(p.id)}
                      title="Retirer"
                    >
                      <i className="bi bi-heartbreak me-2" />
                      Retirer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
