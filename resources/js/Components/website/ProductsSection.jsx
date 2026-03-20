import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { inventoryApi } from "../../api/inventories";
import { publicTestimonialsApi } from "../../api/public_testimonials";
import AddToCartToggle from "./AddToCartToggle";
import FavoriteButton from "./FavoriteButton";

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

export default function ProductsSection() {
  const [active, setActive] = useState("best");
  const [city, setCity] = useState("all");
  const [q, setQ] = useState("");
  const [inventories, setInventories] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      const currentPrice = Number(inventory?.price ?? product?.price ?? 0);
      const comparePrice = Number(inventory?.compare_price ?? product?.compare_price ?? 0);
      const createdAt = product?.created_at || inventory?.created_at || null;
      const key = `product-${product.id}`;
      const ratingStats = testimonialStats.get(key);
      const ratingCount = ratingStats?.count || 0;
      const ratingValue = ratingCount > 0 ? ratingStats.total / ratingCount : 0;

      const mapped = {
        id: product.id,
        product_id: product.id,
        product_encrypted_id: product.encrypted_id || null,
        inventory_id: inventory.id ?? null,
        encrypted_inventory_id: inventory.encrypted_id || null,
        city_id: city?.id ?? inventory?.city_id ?? null,
        city_name: city?.name || "",
        name: product.name || "Produit",
        description: product.description || "",
        category_key: product?.category?.id ? String(product.category.id) : "other",
        category_name: product?.category?.name || "Sans categorie",
        brand_name: product?.brand?.name || "",
        price: currentPrice,
        compare_price: comparePrice,
        image: getProductImage(product),
        rating: ratingValue,
        rating_count: ratingCount,
        testimonial_count: ratingCount,
        created_at: createdAt,
      };

      const existing = grouped.get(product.id);
      if (!existing) {
        grouped.set(product.id, {
          ...mapped,
          city_ids: city?.id ? [String(city.id)] : [],
          city_names: city?.name ? [city.name] : [],
          city_count: city?.name ? 1 : 0,
        });
        return;
      }

      const existingDiscount = getDiscountPercent(existing.price, existing.compare_price);
      const nextDiscount = getDiscountPercent(mapped.price, mapped.compare_price);
      const shouldReplaceCard =
        nextDiscount > existingDiscount ||
        (nextDiscount === existingDiscount && mapped.price < existing.price);

      const mergedCityIds = Array.from(new Set([...existing.city_ids, ...(city?.id ? [String(city.id)] : [])]));
      const mergedCityNames = Array.from(new Set([...existing.city_names, ...(city?.name ? [city.name] : [])]));

      grouped.set(product.id, {
        ...(shouldReplaceCard ? mapped : existing),
        city_ids: mergedCityIds,
        city_names: mergedCityNames,
        city_count: mergedCityNames.length,
      });
    });

    return Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [inventories, testimonialStats]);

  const bestProductIds = useMemo(() => {
    return new Set(
      [...products]
        .sort((a, b) => {
          if (b.rating_count !== a.rating_count) return b.rating_count - a.rating_count;
          if (b.rating !== a.rating) return b.rating - a.rating;
          return a.price - b.price;
        })
        .slice(0, 4)
        .map((item) => item.id)
    );
  }, [products]);

  const categories = useMemo(() => {
    const dynamic = Array.from(
      new Map(
        products.map((item) => [
          item.category_key,
          { key: item.category_key, label: item.category_name },
        ])
      ).values()
    ).sort((a, b) => a.label.localeCompare(b.label));

    return [
      { key: "best", label: "Best sellers" },
      { key: "new", label: "Nouveautes" },
      ...dynamic,
    ];
  }, [products]);

  const cities = useMemo(() => {
    const seen = new Map();

    inventories.forEach((inventory) => {
      const currentCity = inventory?.city;
      const product = inventory?.product;

      if (
        !currentCity?.id ||
        inventory?.is_available !== true ||
        product?.is_active !== true ||
        currentCity?.is_active !== true
      ) {
        return;
      }

      seen.set(currentCity.id, {
        key: String(currentCity.id),
        label: currentCity.name || `Ville ${currentCity.id}`,
      });
    });

    return [
      { key: "all", label: "Toutes les villes" },
      ...Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [inventories]);

  const filtered = useMemo(() => {
    let list = [...products];

    if (active === "best") {
      list = list.filter((item) => bestProductIds.has(item.id));
      list.sort((a, b) => {
        if (b.rating_count !== a.rating_count) return b.rating_count - a.rating_count;
        if (b.rating !== a.rating) return b.rating - a.rating;
        return a.name.localeCompare(b.name);
      });
    } else if (active === "new") {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      list = list.slice(0, 8);
    } else {
      list = list.filter((item) => item.category_key === active);
    }

    if (city !== "all") {
      list = list.filter((item) => item.city_ids.includes(city));
    }

    if (q.trim()) {
      const search = normalizeText(q);
      list = list.filter((item) =>
        [item.name, item.category_name, item.brand_name, item.city_names.join(" ")]
          .some((value) => normalizeText(value).includes(search))
      );
    }

    return list.map((item) => {
      const discount = getDiscountPercent(item.price, item.compare_price);
      const isNew = item.created_at
        ? Date.now() - new Date(item.created_at).getTime() <= 1000 * 60 * 60 * 24 * 30
        : false;

      const badges = [];
      if (discount > 0) badges.push({ key: "promo", label: `Promo -${discount}%`, tone: getBadgeTone("promo") });
      if (isNew) badges.push({ key: "new", label: "Nouveau", tone: getBadgeTone("new") });
      if (bestProductIds.has(item.id)) badges.push({ key: "best", label: "Best", tone: getBadgeTone("best") });

      return { ...item, badges };
    });
  }, [active, bestProductIds, city, products, q]);

  return (
    <section className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-2" style={{ fontFamily: "cursive" }}>
            Nos Produits
          </h2>
          <p className="text-secondary mb-0">
            Produits reels, favoris, avis clients et statuts mis a jour depuis la boutique.
          </p>
        </div>

        <div className="d-flex flex-column gap-3 mb-4">
          <ul className="nav nav-pills gap-2 flex-wrap justify-content-center">
            {categories.map((c) => (
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

          <div className="d-flex flex-column flex-lg-row align-items-center justify-content-between gap-3">
            <div className="w-100" style={{ maxWidth: 260 }}>
              <select
                className="form-select"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                {cities.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ maxWidth: 340 }}>
              <span className="input-group-text bg-white">
                <i className="bi bi-search" />
              </span>
              <input
                className="form-control"
                placeholder="Rechercher un produit..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error ? <div className="alert alert-danger mb-4">{error}</div> : null}

        <div className="text-secondary small mb-3">
          {loading ? "Chargement des produits..." : `${filtered.length} produit(s) affiché(s)`}
        </div>

        <div className="row g-4">
          {loading && (
            <div className="col-12">
              <div className="alert alert-light mb-0">Chargement des produits...</div>
            </div>
          )}

          {!loading &&
            filtered.map((p) => (
              <div className="col-12 col-sm-6 col-lg-3" key={p.id}>
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
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                      <small className="text-uppercase text-secondary">{p.category_name}</small>
                      {p.city_count > 0 && <span className="badge text-bg-light">{p.city_count} ville(s)</span>}
                    </div>

                    <Link to={`/product/${p.product_encrypted_id}`} className="text-decoration-none text-dark">
                      <h6 className="fw-semibold mt-1 mb-2">{p.name}</h6>
                    </Link>

                    {p.description && (
                      <p className="text-secondary small mb-3">
                        {p.description.length > 88 ? `${p.description.slice(0, 88)}...` : p.description}
                      </p>
                    )}

                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Stars value={p.rating} />
                      <small className="text-secondary">
                        {p.testimonial_count > 0 ? `${p.rating.toFixed(1)} (${p.testimonial_count} avis)` : "Pas encore d'avis"}
                      </small>
                    </div>

                    <div className="mb-3">
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

          {!loading && filtered.length === 0 && (
            <div className="col-12">
              <div className="alert alert-warning mb-0">Aucun produit ne correspond a la recherche.</div>
            </div>
          )}
        </div>

        <div className="text-center mt-4 d-flex justify-content-center flex-wrap gap-2">
          <Link className="btn btn-outline-dark btn-sm px-4" to="/shop">
            Voir tous les produits
          </Link>
          <Link className="btn btn-dark btn-sm px-4" to="/testimonials">
            Laisser une note
          </Link>
        </div>
      </div>
    </section>
  );
}
