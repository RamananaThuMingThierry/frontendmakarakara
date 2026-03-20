import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { inventoryApi } from "../../api/inventories";
import { publicTestimonialsApi } from "../../api/public_testimonials";
import AddToCartToggle from "../../Components/website/AddToCartToggle";
import FavoriteButton from "../../Components/website/FavoriteButton";

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

function getDiscountPercent(price, comparePrice) {
  const current = Number(price || 0);
  const previous = Number(comparePrice || 0);

  if (previous <= current || previous <= 0) return 0;
  return Math.round(((previous - current) / previous) * 100);
}

function getBadgeTone(type) {
  if (type === "promo") return "text-bg-danger";
  if (type === "new") return "text-bg-success";
  if (type === "best") return "text-bg-warning";
  return "text-bg-secondary";
}

function Stars({ value }) {
  const safeValue = Math.max(0, Math.min(5, Number(value || 0)));
  const full = Math.floor(safeValue);
  const half = safeValue - full >= 0.5;
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
  const [inventories, setInventories] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
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

        const [inventoryData, testimonialData] = await Promise.all([
          inventoryApi.shopList(),
          publicTestimonialsApi.list().catch(() => []),
        ]);

        if (cancelled) return;

        setInventories(Array.isArray(inventoryData) ? inventoryData : []);
        setTestimonials(Array.isArray(testimonialData) ? testimonialData : []);
      } catch (err) {
        if (cancelled) return;
        setError(err?.response?.data?.message || "Impossible de charger les produits.");
        setInventories([]);
        setTestimonials([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const testimonialStats = useMemo(() => {
    const stats = new Map();

    testimonials.forEach((item) => {
      const key = item?.product_id ? `product-${item.product_id}` : normalizeText(item?.product_used);
      const rating = Number(item?.rating || 0);

      if (!key || rating <= 0) return;

      const current = stats.get(key) || { total: 0, count: 0 };
      current.total += rating;
      current.count += 1;
      stats.set(key, current);
    });

    return stats;
  }, [testimonials]);

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

  const bestProductIds = useMemo(() => {
    return new Set(
      [...validInventories]
        .map((inventory) => {
          const product = inventory?.product || {};
          const stats = testimonialStats.get(`product-${product.id}`);
          return {
            id: product.id,
            rating: stats?.count ? stats.total / stats.count : 0,
            count: stats?.count || 0,
            price: Number(inventory?.price ?? product?.price ?? 0),
          };
        })
        .filter((item) => item.id)
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          if (b.rating !== a.rating) return b.rating - a.rating;
          return a.price - b.price;
        })
        .slice(0, 6)
        .map((item) => item.id)
    );
  }, [testimonialStats, validInventories]);

  const filtered = useMemo(() => {
    let list = validInventories.map((inventory) => {
      const product = inventory.product || {};
      const currentCategory = product.category || {};
      const currentCity = inventory.city || {};
      const stats = testimonialStats.get(`product-${product.id}`);
      const ratingCount = stats?.count || 0;
      const rating = ratingCount > 0 ? stats.total / ratingCount : 0;
      const price = Number(inventory.price ?? product.price ?? 0);
      const comparePrice = Number(inventory.compare_price ?? product.compare_price ?? 0);
      const discount = getDiscountPercent(price, comparePrice);
      const createdAt = product.created_at || inventory.created_at || null;
      const isNew = createdAt
        ? Date.now() - new Date(createdAt).getTime() <= 1000 * 60 * 60 * 24 * 30
        : false;

      const badges = [];
      if (discount > 0) badges.push({ key: "promo", label: `Promo -${discount}%`, tone: getBadgeTone("promo") });
      if (isNew) badges.push({ key: "new", label: "Nouveau", tone: getBadgeTone("new") });
      if (bestProductIds.has(product.id)) badges.push({ key: "best", label: "Best", tone: getBadgeTone("best") });

      return {
        id: product.id ?? null,
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
        price,
        compare_price: comparePrice,
        image: getProductImage(product),
        rating,
        testimonial_count: ratingCount,
        badges,
      };
    });

    if (city !== "all") {
      list = list.filter((item) => item.city_id && String(item.city_id) === city);
    }

    if (category !== "all") {
      list = list.filter((item) => item.category_id === category);
    }

    if (q.trim()) {
      const search = normalizeText(q);
      list = list.filter(
        (item) =>
          normalizeText(item.name).includes(search) ||
          normalizeText(item.city_name).includes(search) ||
          normalizeText(item.category_name).includes(search)
      );
    }

    if (sort === "priceAsc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "priceDesc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "city") list = [...list].sort((a, b) => a.city_name.localeCompare(b.city_name));
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating || b.testimonial_count - a.testimonial_count);

    return list;
  }, [bestProductIds, category, city, q, sort, testimonialStats, validInventories]);

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
              Les produits affiches proviennent des inventaires disponibles, avec notes clients, favoris et badges.
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
              <option value="rating">Note : meilleure</option>
              <option value="city">Ville : A a Z</option>
            </select>

            <Link to="/testimonials" className="btn btn-outline-dark">
              Laisser une note
            </Link>
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

        <div className="alert alert-info border-0 shadow-sm mb-4">
          Une commande doit contenir les produits d'une seule ville. Si vous achetez a Antananarivo, choisissez uniquement
          les produits de Antananarivo. Pour une autre ville, faites une autre commande.
        </div>

        {error && <div className="alert alert-danger mb-4">{error}</div>}

        <div className="text-secondary small mb-3">
          {loading ? "Chargement des produits..." : `${filtered.length} produit(s) - Page ${currentPage}/${totalPages}`}
        </div>

        <div className="row g-4">
          {!loading &&
            paginated.map((p) => (
              <div className="col-12 col-sm-6 col-lg-3" key={`${p.product_id}-${p.inventory_id}`}>
                <div className="card border-0 shadow-sm h-100">
                  <div className="position-relative">
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

                    <div className="position-absolute top-0 start-0 m-2 d-flex flex-wrap gap-2 pe-5">
                      {p.badges.map((badge) => (
                        <span key={badge.key} className={`badge ${badge.tone}`}>
                          {badge.label}
                        </span>
                      ))}
                    </div>

                    <FavoriteButton
                      product={p}
                      className="position-absolute top-0 end-0 m-2"
                    />
                  </div>

                  <div className="card-body d-flex flex-column">
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                      <small className="text-uppercase text-secondary">{p.category_name}</small>
                      <span className="badge text-bg-light">{p.city_name}</span>
                    </div>

                    <Link to={`/product/${p.product_encrypted_id}`} className="text-decoration-none text-dark">
                      <h6 className="fw-semibold mt-1">{p.name}</h6>
                    </Link>

                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Stars value={p.rating} />
                      <small className="text-secondary">
                        {p.testimonial_count > 0 ? `${p.rating.toFixed(1)} (${p.testimonial_count} avis)` : "Pas encore d'avis"}
                      </small>
                    </div>

                    {p.description && (
                      <p className="text-secondary small mb-3">
                        {p.description.length > 90 ? `${p.description.slice(0, 90)}...` : p.description}
                      </p>
                    )}

                    <div className="small text-secondary mb-2">
                      Livraison pour la ville : <span className="fw-semibold">{p.city_name || "-"}</span>
                    </div>

                    <div className="mt-auto">
                      <div className="fw-bold text-danger">{formatPriceMGA(p.price)}</div>
                      {p.compare_price > p.price && (
                        <small className="text-secondary text-decoration-line-through">
                          {formatPriceMGA(p.compare_price)}
                        </small>
                      )}
                    </div>

                    <div className="d-grid gap-2 mt-3">
                      <AddToCartToggle product={p} variant="compact" />
                      <Link to="/testimonials" className="btn btn-outline-secondary btn-sm">
                        Donner une note
                      </Link>
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
