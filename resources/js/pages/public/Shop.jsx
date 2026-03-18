import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AddToCartToggle from "../../Components/website/AddToCartToggle";
import { inventoryApi } from "../../api/inventories";

const DEFAULT_IMAGE = "/images/box.png";

function formatPriceMGA(value) {
  return `${Number(value || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} MGA`;
}

function getProductImage(product) {
  const image = product?.images?.[0];
  return image?.full_url || (image?.url ? `/${image.url}` : DEFAULT_IMAGE);
}

export default function Shop() {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("all");
  const [city, setCity] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const perPage = 8;

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

  const validInventories = useMemo(() => {
    return inventories.filter((inventory) => {
      const product = inventory?.product;
      const currentCity = inventory?.city;

      return Boolean(
        inventory?.city_id &&
          inventory?.is_available === true &&
          product?.is_active === true &&
          currentCity?.is_active === true
      );
    });
  }, [inventories]);

  const categories = useMemo(() => {
    const seen = new Map();

    validInventories.forEach((inventory) => {
      const currentCategory = inventory?.product?.category;
      if (!currentCategory?.id) return;

      seen.set(currentCategory.id, {
        key: String(currentCategory.id),
        label: currentCategory.name || `Categorie ${currentCategory.id}`,
      });
    });

    return [
      { key: "all", label: "Toutes" },
      ...Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [validInventories]);

  const cities = useMemo(() => {
    const seen = new Map();

    validInventories.forEach((inventory) => {
      const currentCity = inventory?.city;
      if (!currentCity?.id) return;

      seen.set(currentCity.id, {
        key: String(currentCity.id),
        label: currentCity.name || `Ville ${currentCity.id}`,
      });
    });

    return [
      { key: "all", label: "Toutes les villes" },
      ...Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [validInventories]);

  const filtered = useMemo(() => {
    let list = validInventories.map((inventory) => {
      const product = inventory.product || {};
      const currentCategory = product.category || {};
      const currentCity = inventory.city || {};

      return {
        id: `inventory-${inventory.encrypted_id}`,
        product_id: product.id ?? null,
        inventory_id: inventory.id ?? null,
        encrypted_inventory_id: inventory.encrypted_id || null,
        product_encrypted_id: product.encrypted_id || null,
        city_id: currentCity.id ?? inventory.city_id ?? null,
        city_name: currentCity.name || "",
        name: product.name || "Produit",
        description: product.description || "",
        category_id: currentCategory.id ? String(currentCategory.id) : "",
        category_name: currentCategory.name || "Sans categorie",
        price: Number(inventory.price ?? product.price ?? 0),
        compare_price: Number(inventory.compare_price ?? product.compare_price ?? 0),
        image: getProductImage(product),
      };
    });

    if (city !== "all") {
      list = list.filter((item) => item.city_id && String(item.city_id) === city);
    }

    if (category !== "all") {
      list = list.filter((item) => item.category_id === category);
    }

    if (q.trim()) {
      const search = q.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(search) ||
          item.city_name.toLowerCase().includes(search) ||
          item.category_name.toLowerCase().includes(search)
      );
    }

    if (sort === "priceAsc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "priceDesc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "city") list = [...list].sort((a, b) => a.city_name.localeCompare(b.city_name));

    return list;
  }, [category, city, q, sort, validInventories]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const resetPage = () => setPage(1);

  return (
    <main className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3 mb-4">
          <div>
            <h1 className="fw-bold mb-1">Boutique</h1>
            <p className="text-secondary mb-0">
              Les produits affiches proviennent uniquement des inventaires disponibles et valides.
            </p>
          </div>

          <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-lg-auto">
            <div className="input-group" style={{ minWidth: 260 }}>
              <span className="input-group-text bg-white">
                <i className="bi bi-search" />
              </span>
              <input
                className="form-control"
                placeholder="Rechercher..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  resetPage();
                }}
              />
            </div>

            <select
              className="form-select"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                resetPage();
              }}
              style={{ minWidth: 220 }}
            >
              <option value="name">Trier : nom</option>
              <option value="priceAsc">Prix : croissant</option>
              <option value="priceDesc">Prix : decroissant</option>
              <option value="city">Ville : A a Z</option>
            </select>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-12 col-lg-6">
            <label className="form-label small text-uppercase text-secondary mb-2">Ville</label>
            <select
              className="form-select"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                resetPage();
              }}
            >
              {cities.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-lg-6">
            <label className="form-label small text-uppercase text-secondary mb-2">Categorie</label>
            <div className="d-flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.key}
                  className={"btn btn-sm " + (category === c.key ? "btn-dark" : "btn-outline-dark")}
                  onClick={() => {
                    setCategory(c.key);
                    resetPage();
                  }}
                  type="button"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger mb-4">{error}</div>}

        <div className="text-secondary small mb-3">
          {loading ? "Chargement des produits..." : `${filtered.length} produit(s) • Page ${currentPage}/${totalPages}`}
        </div>

        <div className="row g-4">
          {!loading &&
            paginated.map((p) => (
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
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                      <small className="text-uppercase text-secondary">{p.category_name}</small>
                      <span className="badge text-bg-light">{p.city_name}</span>
                    </div>

                    <Link to={`/product/${p.product_encrypted_id}`} className="text-decoration-none text-dark">
                      <h6 className="fw-semibold mt-1">{p.name}</h6>
                    </Link>

                    {p.description && (
                      <p className="text-secondary small mb-3">
                        {p.description.length > 90 ? `${p.description.slice(0, 90)}...` : p.description}
                      </p>
                    )}

                    <div className="mt-auto">
                      <div className="fw-bold text-danger">{formatPriceMGA(p.price)}</div>
                      {p.compare_price > p.price && (
                        <small className="text-secondary text-decoration-line-through">
                          {formatPriceMGA(p.compare_price)}
                        </small>
                      )}
                    </div>

                    <div className="mt-auto pt-2">
                      <AddToCartToggle product={p} variant="compact" />
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {loading && (
            <div className="col-12">
              <div className="alert alert-light mb-0">Chargement des produits...</div>
            </div>
          )}

          {!loading && paginated.length === 0 && (
            <div className="col-12">
              <div className="alert alert-warning mb-0">Aucun produit trouve avec ces criteres.</div>
            </div>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <nav className="mt-4">
            <ul className="pagination justify-content-center">
              <li className={"page-item " + (currentPage === 1 ? "disabled" : "")}>
                <button className="page-link" onClick={() => setPage((prev) => prev - 1)}>
                  Precedent
                </button>
              </li>

              {Array.from({ length: totalPages }).map((_, i) => {
                const n = i + 1;
                return (
                  <li className={"page-item " + (currentPage === n ? "active" : "")} key={n}>
                    <button className="page-link" onClick={() => setPage(n)}>
                      {n}
                    </button>
                  </li>
                );
              })}

              <li className={"page-item " + (currentPage === totalPages ? "disabled" : "")}>
                <button className="page-link" onClick={() => setPage((prev) => prev + 1)}>
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
