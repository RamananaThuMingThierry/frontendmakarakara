import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AddToCartToggle from "./AddToCartToggle";
import { productsApi } from "../../api/products";

const DEFAULT_IMAGE = "/images/box.png";

function formatPriceMGA(value) {
  return `${Number(value || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} MGA`;
}

function getImageUrl(image) {
  return image?.full_url || (image?.url ? `/${image.url}` : DEFAULT_IMAGE);
}

export default function ProductDetails() {
  const { encrypted_id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCityId, setSelectedCityId] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError("");
        setProduct(null);

        const data = await productsApi.shopShow(encrypted_id);
        if (cancelled) return;

        setProduct(data || null);

        const firstCityId = data?.inventories?.[0]?.city?.id ?? "";
        setSelectedCityId(firstCityId ? String(firstCityId) : "");
      } catch (err) {
        if (cancelled) return;
        setError(err?.response?.data?.message || "Impossible de charger ce produit.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [encrypted_id]);

  useEffect(() => {
    setActiveIndex(0);
  }, [product?.encrypted_id]);

  const images = useMemo(() => {
    if (!product?.images?.length) return [{ id: "default", full_url: DEFAULT_IMAGE }];
    return product.images;
  }, [product]);

  const validInventories = useMemo(() => {
    return (product?.inventories || []).filter((inventory) => {
      return Boolean(
        inventory?.city_id &&
          inventory?.is_available === true &&
          inventory?.city?.is_active === true
      );
    });
  }, [product]);

  const selectedInventory = useMemo(() => {
    if (!validInventories.length) return null;

    const match = validInventories.find(
      (inventory) => String(inventory?.city?.id ?? inventory?.city_id ?? "") === String(selectedCityId)
    );

    return match || validInventories[0];
  }, [selectedCityId, validInventories]);

  const cartProduct = useMemo(() => {
    if (!product || !selectedInventory) return null;

    return {
      id: `inventory-${selectedInventory.encrypted_id || selectedInventory.id}`,
      product_id: product.id,
      product_encrypted_id: product.encrypted_id,
      inventory_id: selectedInventory.id ?? null,
      encrypted_inventory_id: selectedInventory.encrypted_id || null,
      city_id: selectedInventory.city?.id ?? selectedInventory.city_id ?? null,
      city_name: selectedInventory.city?.name || "",
      name: product.name || "Produit",
      price: Number(selectedInventory.price ?? product.price ?? 0),
      image: getImageUrl(product.images?.[0]),
    };
  }, [product, selectedInventory]);

  if (loading) {
    return (
      <div className="container py-5">
        <div className="alert alert-light mb-0">Chargement du produit...</div>
      </div>
    );
  }

  if (error || !product || !selectedInventory) {
    return (
      <div className="container py-5 text-center">
        <img
          src="/images/rejected.png"
          alt="Produit introuvable"
          className="img-fluid mb-4"
          style={{ maxWidth: 250, opacity: 0.9 }}
        />

        <h5 className="fw-semibold">Produit introuvable</h5>
        <p className="text-muted">{error || "Ce produit n'est pas disponible actuellement."}</p>

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
          <div className="col-12 col-lg-7">
            <div className="row g-3">
              <div className="col-3">
                <div className="d-flex flex-column gap-2">
                  {images.map((image, idx) => {
                    const src = getImageUrl(image);

                    return (
                      <button
                        key={image?.encrypted_id || image?.id || `${src}-${idx}`}
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
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_IMAGE;
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="col-9">
                <div className="bg-white rounded-4 shadow-sm overflow-hidden p-4">
                  <img
                    src={getImageUrl(images[activeIndex])}
                    alt={`${product.name} principale`}
                    className="w-100"
                    style={{ height: 500, objectFit: "cover" }}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_IMAGE;
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="bg-white rounded-4 shadow-sm p-4">
              <h1 className="h3 fw-bold mb-2">{product.name}</h1>

              <div className="mb-2 d-flex flex-wrap gap-2">
                <span className="badge text-bg-warning border">{product.category?.name || "Sans categorie"}</span>
              </div>

              <div className="mb-2">
                <span className="text-secondary">Marque :</span>{" "}
                <span className="fw-semibold">{product.brand?.name || "-"}</span>
              </div>


              <div className="mb-3">
                <label className="form-label text-secondary mb-1">Disponible dans :</label>
                <select
                  className="form-select"
                  value={String(selectedInventory.city?.id ?? selectedInventory.city_id ?? "")}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                >
                  {validInventories.map((inventory) => (
                    <option
                      key={inventory.encrypted_id || inventory.id}
                      value={String(inventory.city?.id ?? inventory.city_id ?? "")}
                    >
                      {inventory.city?.name || "Ville"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <div className="h4 fw-bold text-danger mb-1">
                  {formatPriceMGA(selectedInventory.price ?? product.price)}
                </div>
                {Number(selectedInventory.compare_price || 0) > Number(selectedInventory.price || 0) && (
                  <div className="text-secondary text-decoration-line-through">
                    {formatPriceMGA(selectedInventory.compare_price)}
                  </div>
                )}
              </div>

              <p className="text-secondary">{product.description || "Aucune description disponible."}</p>

              <div className="d-grid gap-2">
                <AddToCartToggle product={cartProduct} />

                <Link to="/shop" className="btn btn-outline-dark">
                  Retour a la boutique
                </Link>
              </div>

              <hr />

              <ul className="list-unstyled text-secondary small mb-0">
                <li className="mb-1">
                  <i className="bi bi-geo-alt me-2 text-warning" />
                  Ville selectionnee : <span className="fw-semibold">{selectedInventory.city?.name || "-"}</span>
                </li>
                <li className="mb-1">
                  <i className="bi bi-box-seam me-2 text-warning" />
                  Disponibilite : <span className="fw-semibold">En stock</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
