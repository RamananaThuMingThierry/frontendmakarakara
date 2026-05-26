import { useEffect, useMemo, useState } from "react";
import { slidesApi } from "../../api/slides";
import { useI18n } from "../../hooks/website/I18nContext";

function getImageUrl(path) {
  if (!path) return "/website/images/slide_1.jpg";
  if (/^https?:\/\//i.test(path)) return path;
  return `/${String(path).replace(/^\/+/, "")}`;
}

export default function HeroCarousel() {
  const { t } = useI18n();
  const fallbackSlides = [
    {
      id: "fallback-1",
      title: t("home.hero.fallback1.title", "Sublimez vos cheveux"),
      subtitle: t(
        "home.hero.fallback1.subtitle",
        "Decouvrez notre gamme exclusive de soins capillaires et d'accessoires de qualite professionnelle."
      ),
      image_url: "/website/images/slide_1.jpg",
      position: 1,
    },
    {
      id: "fallback-2",
      title: t("home.hero.fallback2.title", "Nouveautes et meilleures ventes"),
      subtitle: t(
        "home.hero.fallback2.subtitle",
        "Retrouvez les produits preferes de nos clientes et les offres du moment dans la boutique."
      ),
      image_url: "/website/images/slide_2.jpg",
      position: 2,
    },
  ];

  const getButtonConfig = (slide) => {
    const text = `${slide?.title || ""} ${slide?.subtitle || ""}`.toLowerCase();

    if (text.includes("avis") || text.includes("temoign")) {
      return { label: t("home.hero.actions.review", "Laisser un avis"), href: "/testimonials" };
    }

    return { label: t("home.hero.actions.shop", "Voir la boutique"), href: "/shop" };
  };

  const [slides, setSlides] = useState(fallbackSlides);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        const data = await slidesApi.publicList();
        if (cancelled) return;

        const items = Array.isArray(data) ? data : [];
        if (items.length > 0) {
          setSlides(items);
        } else {
          setSlides(fallbackSlides);
        }
      } catch {
        if (!cancelled) {
          setSlides(fallbackSlides);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [fallbackSlides]);

  const orderedSlides = useMemo(() => {
    return [...slides].sort((a, b) => Number(a?.position || 0) - Number(b?.position || 0));
  }, [slides]);

  const activeSlides = orderedSlides.length > 0 ? orderedSlides : fallbackSlides;

  return (
    <section className="position-relative">
      <div
        id="heroCarousel"
        className="carousel slide"
        data-bs-ride="carousel"
        data-bs-interval="5000"
      >
        {activeSlides.length > 1 && (
          <div className="carousel-indicators">
            {activeSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                data-bs-target="#heroCarousel"
                data-bs-slide-to={i}
                className={i === 0 ? "active" : ""}
                aria-current={i === 0 ? "true" : undefined}
                aria-label={`${t("home.hero.slide", "Diapositive")} ${i + 1}`}
              />
            ))}
          </div>
        )}

        <div className="carousel-inner">
          {activeSlides.map((slide, i) => {
            const button = getButtonConfig(slide);

            return (
              <div key={slide.id || i} className={`carousel-item ${i === 0 ? "active" : ""}`}>
                <img
                  src={getImageUrl(slide.image_url)}
                  className="d-block w-100"
                  alt={slide.title || `${t("home.hero.slideAlt", "Slide")} ${i + 1}`}
                  style={{ height: "750px", objectFit: "cover" }}
                />

                <div
                  className="position-absolute top-0 start-0 w-100 h-100"
                  style={{ background: "rgba(0,0,0,0.35)" }}
                />

                <div className="carousel-caption text-start">
                  <div className="container">
                    <div className="col-12 col-lg-7">
                      <h1 className="display-5 fw-bold">
                        {slide.title || t("home.hero.defaultTitle", "Bienvenue")}
                      </h1>
                      <p className="lead">
                        {slide.subtitle || t("home.hero.defaultSubtitle", "Decouvrez nos produits et services.")}
                      </p>
                      <a className="btn btn-dark px-4" href={button.href}>
                        {button.label}
                      </a>

                      <div className="d-flex flex-wrap gap-4 mt-4">
                        <div>
                          <div className="fw-bold d-flex align-items-center gap-2">
                            <i className="bi bi-people-fill text-warning"></i>
                            {t("home.hero.highlights.clients", "+5000 clients satisfaits")}
                          </div>
                          <small className="text-white-50">
                            {t("home.hero.highlights.clientsText", "Ils nous font confiance chaque jour")}
                          </small>
                        </div>

                        <div>
                          <div className="fw-bold d-flex align-items-center gap-2">
                            <i className="bi bi-truck text-warning"></i>
                            {t("home.hero.highlights.delivery", "Livraison rapide")}
                          </div>
                          <small className="text-white-50">
                            {t("home.hero.highlights.deliveryText", "Suivi precis avec GPS")}
                          </small>
                        </div>

                        <div>
                          <div className="fw-bold d-flex align-items-center gap-2">
                            <i className="bi bi-star-fill text-warning"></i>
                            {t("home.hero.highlights.reviews", "Avis verifies")}
                          </div>
                          <small className="text-white-50">
                            {t("home.hero.highlights.reviewsText", "Produits fiables")}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {activeSlides.length > 1 && !loading && (
          <>
            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target="#heroCarousel"
              data-bs-slide="prev"
            >
              <span className="carousel-control-prev-icon" aria-hidden="true" />
              <span className="visually-hidden">{t("home.hero.previous", "Precedent")}</span>
            </button>

            <button
              className="carousel-control-next"
              type="button"
              data-bs-target="#heroCarousel"
              data-bs-slide="next"
            >
              <span className="carousel-control-next-icon" aria-hidden="true" />
              <span className="visually-hidden">{t("home.hero.next", "Suivant")}</span>
            </button>
          </>
        )}
      </div>
    </section>
  );
}
