import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AddToCartToggle from "./AddToCartToggle";
import { productsApi } from "../../api/products";
import { publicTestimonialsApi } from "../../api/public_testimonials";
import { useI18n } from "../../hooks/website/I18nContext";

const DEFAULT_IMAGE = "/images/box.png";
const initialReviewForm = {
  name: "",
  city: "",
  rating: "",
  message: "",
  photo_url: null,
};

function formatPriceMGA(value) {
  return `${Number(value || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} MGA`;
}

function getImageUrl(image) {
  return image?.full_url || (image?.url ? `/${image.url}` : DEFAULT_IMAGE);
}

function buildImageUrl(path) {
  if (!path) return "/images/img.png";
  if (/^https?:\/\//i.test(path)) return path;

  const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
  const base = apiUrl.replace(/\/api\/?$/, "");
  return `${base}/${String(path).replace(/^\/+/, "")}`;
}

function Stars({ value }) {
  return (
    <span className="text-warning">
      {Array.from({ length: 5 }).map((_, idx) => (
        <i key={idx} className={`bi ${idx < Number(value || 0) ? "bi-star-fill" : "bi-star"}`} />
      ))}
    </span>
  );
}

export default function ProductDetails() {
  const { t } = useI18n();
  const { encrypted_id } = useParams();
  const [product, setProduct] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [reviewForm, setReviewForm] = useState(initialReviewForm);
  const [reviewErrors, setReviewErrors] = useState({});
  const [reviewServerError, setReviewServerError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewSending, setReviewSending] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError("");
        setProduct(null);

        const [data, testimonialData] = await Promise.all([
          productsApi.shopShow(encrypted_id),
          publicTestimonialsApi.list().catch(() => []),
        ]);
        if (cancelled) return;

        setProduct(data || null);
        setTestimonials(Array.isArray(testimonialData) ? testimonialData : []);

        const firstCityId = data?.inventories?.[0]?.city?.id ?? "";
        setSelectedCityId(firstCityId ? String(firstCityId) : "");
      } catch (err) {
        if (cancelled) return;
        setError(err?.response?.data?.message || t("productDetails.errors.load", "Impossible de charger ce produit."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [encrypted_id, t]);

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

  const availableCityNames = useMemo(
    () => Array.from(new Set(validInventories.map((inventory) => inventory.city?.name).filter(Boolean))),
    [validInventories]
  );

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
      name: product.name || t("productDetails.labels.product", "Produit"),
      price: Number(selectedInventory.price ?? product.price ?? 0),
      image: getImageUrl(product.images?.[0]),
    };
  }, [product, selectedInventory]);

  const productTestimonials = useMemo(() => {
    if (!product?.id) return [];

    return testimonials
      .filter((item) => item?.target_type === "product" && Number(item?.product_id) === Number(product.id))
      .slice(0, 6);
  }, [product?.id, testimonials]);

  const averageRating = useMemo(() => {
    if (!productTestimonials.length) return 0;
    return (
      productTestimonials.reduce((sum, item) => sum + Number(item?.rating || 0), 0) / productTestimonials.length
    );
  }, [productTestimonials]);

  const updateReviewField = (field, value) => {
    setReviewForm((current) => ({ ...current, [field]: value }));
    if (reviewErrors[field]) {
      setReviewErrors((current) => ({ ...current, [field]: undefined }));
    }
    if (reviewServerError) setReviewServerError("");
    if (reviewSuccess) setReviewSuccess("");
  };

  const resetReviewForm = () => {
    setReviewForm(initialReviewForm);
    setReviewErrors({});
    setReviewServerError("");
    setReviewSuccess("");
    setPhotoPreview("");
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!product) return;

    setReviewSending(true);
    setReviewErrors({});
    setReviewServerError("");
    setReviewSuccess("");

    const payload = new FormData();
    payload.append("name", reviewForm.name.trim());
    payload.append("city", reviewForm.city.trim());
    payload.append("target_type", "product");
    payload.append("product_id", String(product.id));
    payload.append("product_used", product.name || "");
    payload.append("rating", reviewForm.rating === "" ? "" : String(reviewForm.rating));
    payload.append("message", reviewForm.message.trim());

    if (reviewForm.photo_url instanceof File) {
      payload.append("photo_url", reviewForm.photo_url);
    }

    try {
      const { data, message } = await publicTestimonialsApi.create(payload);
      if (data?.id) {
        setTestimonials((current) => [data, ...current.filter((item) => item.id !== data.id)]);
      }
      resetReviewForm();
      setReviewSuccess(message || t("productDetails.review.success", "Votre avis a ete envoye."));
    } catch (err) {
      const response = err?.response;
      if (response?.data?.errors) {
        setReviewErrors(response.data.errors);
      }
      setReviewServerError(response?.data?.message || t("productDetails.review.error", "Impossible d'envoyer votre avis."));
    } finally {
      setReviewSending(false);
    }
  };

  if (loading) {
        return (
      <div className="container py-5">
        <div className="alert alert-light mb-0">{t("productDetails.loading", "Chargement du produit...")}</div>
      </div>
    );
  }

  if (error || !product || !selectedInventory) {
    return (
      <div className="container py-5 text-center">
        <img
          src="/images/rejected.png"
          alt={t("productDetails.empty.alt", "Produit introuvable")}
          className="img-fluid mb-4"
          style={{ maxWidth: 250, opacity: 0.9 }}
        />

        <h5 className="fw-semibold">{t("productDetails.empty.title", "Produit introuvable")}</h5>
        <p className="text-muted">{error || t("productDetails.empty.subtitle", "Ce produit n'est pas disponible actuellement.")}</p>

        <Link to="/shop" className="btn btn-primary mt-3">
          {t("productDetails.actions.otherProducts", "Voir les autres produits")}
        </Link>
      </div>
    );
  }

  return (
    <main className="py-4 py-lg-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="row g-3 align-items-start">
              <div className="col-12 order-2 order-lg-1 col-lg-3">
                <div className="d-flex d-lg-grid gap-2 overflow-auto pb-1">
                  {images.map((image, idx) => {
                    const src = getImageUrl(image);

                    return (
                      <button
                        key={image?.encrypted_id || image?.id || `${src}-${idx}`}
                        type="button"
                        className={
                          "border rounded-3 p-0 overflow-hidden bg-white flex-shrink-0 " +
                          (idx === activeIndex ? "border-dark" : "border-light")
                        }
                        onClick={() => setActiveIndex(idx)}
                        style={{ aspectRatio: "1 / 1", width: "88px" }}
                        aria-label={t("productDetails.actions.viewImage", "Voir image {{index}}").replace("{{index}}", idx + 1)}
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

              <div className="col-12 order-1 order-lg-2 col-lg-9">
                <div className="bg-white rounded-4 shadow-sm overflow-hidden p-2 p-md-4">
                  <img
                    src={getImageUrl(images[activeIndex])}
                    alt={t("productDetails.labels.mainImage", "{{name}} principale").replace("{{name}}", product.name)}
                    className="w-100"
                    style={{ height: "min(70vw, 500px)", minHeight: 280, objectFit: "cover" }}
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
            <div className="bg-white rounded-4 shadow-sm p-3 p-md-4">
              <h1 className="h3 fw-bold mb-2">{product.name}</h1>

              <div className="mb-3 d-flex flex-wrap gap-2">
                <span className="badge text-bg-warning border">{product.category?.name || t("productDetails.labels.uncategorized", "Sans categorie")}</span>
                <span className="badge text-bg-light border">{selectedInventory.city?.name || t("productDetails.labels.city", "Ville")}</span>
              </div>

              <div className="mb-3">
                <span className="text-secondary">{t("productDetails.labels.brand", "Marque")} :</span>{" "}
                <span className="fw-semibold">{product.brand?.name || "-"}</span>
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary mb-1">{t("productDetails.labels.availableIn", "Disponible dans")} :</label>
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
                      {inventory.city?.name || t("productDetails.labels.city", "Ville")}
                    </option>
                  ))}
                </select>

                {availableCityNames.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {availableCityNames.map((cityName) => (
                      <span key={cityName} className="badge rounded-pill text-bg-light border">
                        {cityName}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="alert alert-info py-2 mb-3">
                {t(
                  "productDetails.cityRule",
                  'Une commande doit contenir les produits d\'une seule ville. Si vous choisissez "{{city}}", achetez uniquement les produits de cette ville.'
                ).replace("{{city}}", selectedInventory.city?.name || t("productDetails.labels.thisCity", "cette ville"))}
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

              <p className="text-secondary mb-4">{product.description || t("productDetails.labels.noDescription", "Aucune description disponible.")}</p>

              <div className="d-grid gap-2">
                <AddToCartToggle product={cartProduct} />

                <Link to="/shop" className="btn btn-outline-dark">
                  {t("productDetails.actions.backToShop", "Retour a la boutique")}
                </Link>
              </div>

              <hr />

              <ul className="list-unstyled text-secondary small mb-0">
                <li className="mb-1">
                  <i className="bi bi-geo-alt me-2 text-warning" />
                  {t("productDetails.labels.selectedCity", "Ville selectionnee")} : <span className="fw-semibold">{selectedInventory.city?.name || "-"}</span>
                </li>
                <li className="mb-1">
                  <i className="bi bi-diagram-3 me-2 text-warning" />
                  {t("productDetails.labels.availableCities", "Villes disponibles")} :{" "}
                  <span className="fw-semibold">
                    {availableCityNames.join(", ") || "-"}
                  </span>
                </li>
                <li className="mb-1">
                  <i className="bi bi-box-seam me-2 text-warning" />
                  {t("productDetails.labels.availability", "Disponibilite")} : <span className="fw-semibold">{t("productDetails.labels.inStock", "En stock")}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="row g-4 mt-1 mt-lg-3">
          <div className="col-12 col-lg-7">
            <div className="bg-white rounded-4 shadow-sm p-3 p-md-4 h-100">
              <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-3">
                <div>
                  <h4 className="fw-bold mb-1">{t("productDetails.reviews.title", "Avis sur ce produit")}</h4>
                  <div className="text-secondary small">
                    {productTestimonials.length > 0 ? (
                      <>
                        <Stars value={Math.round(averageRating)} />{" "}
                        <span className="ms-2">
                          {t("productDetails.reviews.summary", "{{rating}}/5 sur {{count}} avis")
                            .replace("{{rating}}", averageRating.toFixed(1))
                            .replace("{{count}}", productTestimonials.length)}
                        </span>
                      </>
                    ) : (
                      t("productDetails.reviews.empty", "Aucun avis publie pour le moment.")
                    )}
                  </div>
                </div>

                <Link to="/testimonials" className="btn btn-outline-dark btn-sm">
                  {t("productDetails.actions.viewAllReviews", "Voir tous les avis")}
                </Link>
              </div>

              {productTestimonials.length === 0 ? (
                <div className="alert alert-light mb-0">{t("productDetails.reviews.first", "Soyez le premier a laisser un avis sur ce produit.")}</div>
              ) : (
                <div className="row g-3">
                  {productTestimonials.map((item) => (
                    <div className="col-12" key={item.id}>
                      <div className="border rounded-4 p-3 p-md-4 h-100" style={{ background: "#fcfaf4" }}>
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <img
                            src={buildImageUrl(item.photo_url)}
                            alt={item.name || t("productDetails.labels.client", "Client")}
                            className="rounded-circle border"
                            style={{ width: 52, height: 52, objectFit: "cover" }}
                          />
                          <div className="min-w-0">
                            <div className="fw-semibold">{item.name || t("productDetails.labels.client", "Client")}</div>
                            <div className="text-secondary small">{item.city || t("productDetails.labels.client", "Client")}</div>
                          </div>
                        </div>

                        <div className="mb-2">
                          <Stars value={item.rating} />
                        </div>

                        <p className="text-secondary mb-0">{item.message || "-"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="bg-white rounded-4 shadow-sm p-3 p-md-4">
              <h4 className="fw-bold mb-2">{t("productDetails.reviewForm.title", "Ajouter votre avis")}</h4>
              <p className="text-secondary mb-3">
                {t("productDetails.reviewForm.subtitle", 'Votre note sera associee directement a "{{name}}".').replace("{{name}}", product.name)}
              </p>

              {reviewSuccess ? <div className="alert alert-success">{reviewSuccess}</div> : null}
              {reviewServerError ? <div className="alert alert-danger">{reviewServerError}</div> : null}

              <form className="row g-3" onSubmit={submitReview} noValidate>
                <div className="col-12">
                  <label className="form-label">{t("productDetails.reviewForm.name", "Nom")} *</label>
                  <input
                    className={`form-control ${reviewErrors.name ? "is-invalid" : ""}`}
                    value={reviewForm.name}
                    onChange={(e) => updateReviewField("name", e.target.value)}
                    disabled={reviewSending}
                  />
                  {reviewErrors.name ? <div className="invalid-feedback">{reviewErrors.name[0]}</div> : null}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">{t("productDetails.reviewForm.city", "Ville")}</label>
                  <input
                    className={`form-control ${reviewErrors.city ? "is-invalid" : ""}`}
                    value={reviewForm.city}
                    onChange={(e) => updateReviewField("city", e.target.value)}
                    disabled={reviewSending}
                  />
                  {reviewErrors.city ? <div className="invalid-feedback">{reviewErrors.city[0]}</div> : null}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">{t("productDetails.reviewForm.rating", "Note")} *</label>
                  <select
                    className={`form-select ${reviewErrors.rating ? "is-invalid" : ""}`}
                    value={reviewForm.rating}
                    onChange={(e) => updateReviewField("rating", e.target.value)}
                    disabled={reviewSending}
                  >
                    <option value="">{t("productDetails.reviewForm.choose", "Choisir")}</option>
                    <option value="5">{t("productDetails.reviewForm.stars5", "5 etoiles")}</option>
                    <option value="4">{t("productDetails.reviewForm.stars4", "4 etoiles")}</option>
                    <option value="3">{t("productDetails.reviewForm.stars3", "3 etoiles")}</option>
                    <option value="2">{t("productDetails.reviewForm.stars2", "2 etoiles")}</option>
                    <option value="1">{t("productDetails.reviewForm.stars1", "1 etoile")}</option>
                  </select>
                  {reviewErrors.rating ? <div className="invalid-feedback">{reviewErrors.rating[0]}</div> : null}
                </div>

                <div className="col-12">
                  <label className="form-label">{t("productDetails.reviewForm.message", "Votre avis")} *</label>
                  <textarea
                    rows={4}
                    className={`form-control ${reviewErrors.message ? "is-invalid" : ""}`}
                    value={reviewForm.message}
                    onChange={(e) => updateReviewField("message", e.target.value)}
                    disabled={reviewSending}
                  />
                  {reviewErrors.message ? <div className="invalid-feedback">{reviewErrors.message[0]}</div> : null}
                </div>

                <div className="col-12">
                  <label className="form-label">{t("productDetails.reviewForm.photo", "Photo (optionnel)")}</label>
                  <input
                    type="file"
                    accept="image/*"
                    className={`form-control ${reviewErrors.photo_url ? "is-invalid" : ""}`}
                    disabled={reviewSending}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      updateReviewField("photo_url", file);
                      setPhotoPreview(file ? URL.createObjectURL(file) : "");
                    }}
                  />
                  {reviewErrors.photo_url ? <div className="invalid-feedback">{reviewErrors.photo_url[0]}</div> : null}
                </div>

                {photoPreview ? (
                  <div className="col-12">
                    <img
                      src={photoPreview}
                      alt={t("productDetails.reviewForm.previewAlt", "Apercu")}
                      className="img-fluid rounded-3 border"
                      style={{ maxHeight: 180, objectFit: "cover" }}
                    />
                  </div>
                ) : null}

                <div className="col-12 d-flex flex-column flex-sm-row gap-2">
                  <button className="btn btn-warning fw-semibold" type="submit" disabled={reviewSending}>
                    {reviewSending ? t("productDetails.reviewForm.sending", "Envoi en cours...") : t("productDetails.reviewForm.send", "Envoyer mon avis")}
                  </button>
                  <button className="btn btn-outline-dark" type="button" onClick={resetReviewForm} disabled={reviewSending}>
                    {t("productDetails.reviewForm.reset", "Reinitialiser")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
