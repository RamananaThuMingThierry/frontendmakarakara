import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { publicTestimonialsApi } from "../../api/public_testimonials";
import { useI18n } from "../../hooks/website/I18nContext";

function buildImageUrl(path) {
  if (!path) return "/images/img.png";
  if (/^https?:\/\//i.test(path)) return path;

  const apiUrl = import.meta.env.VITE_API_URL || "http://192.168.0.17:8000/api";
  const base = apiUrl.replace(/\/api\/?$/, "");
  return `${base}/${String(path).replace(/^\/+/, "")}`;
}

export default function TestimonialSection() {
  const { t } = useI18n();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await publicTestimonialsApi.list();
        if (active) setTestimonials(Array.isArray(data) ? data.slice(0, 3) : []);
      } catch {
        if (active) setTestimonials([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const Card = ({ item }) => (
    <div className="col-12 col-md-4">
      <div className="p-4 rounded-4 shadow-sm h-100" style={{ background: "#fbf7ec" }}>
        <div className="d-flex align-items-center mb-3">
          <img
            src={buildImageUrl(item.photo_url)}
            alt={item.name}
            className="rounded-circle me-3"
            style={{
              width: 56,
              height: 56,
              objectFit: "cover",
              border: "2px solid #fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          />

          <div>
            <div className="fw-bold">{item.name}</div>
            <div className="text-secondary small">{item.city || t("home.testimonials.clientLabel", "Client")}</div>
          </div>
        </div>

        <div className="text-warning mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <i key={i} className={`bi ${i < Number(item.rating || 0) ? "bi-star-fill" : "bi-star"}`} />
          ))}
        </div>

        <p className="text-secondary mb-0">"{item.message}"</p>
      </div>
    </div>
  );

  return (
    <section className="py-5">
      <div className="container">
        <div className="text-center mb-4">
          <h3 className="fw-bold" style={{ fontFamily: "cursive" }}>
            {t("home.testimonials.title", "Temoignages")}
          </h3>
          <p className="text-secondary mb-0">
            {t("home.testimonials.subtitle", "Ce que nos clients disent de nous")}
          </p>
        </div>

        {loading ? (
          <div className="text-center text-muted">{t("home.testimonials.loading", "Chargement...")}</div>
        ) : testimonials.length === 0 ? (
          <div className="text-center text-muted">
            {t("home.testimonials.empty", "Aucun avis publie pour le moment.")}
          </div>
        ) : (
          <div className="row g-3">
            {testimonials.map((item) => (
              <Card key={item.id} item={item} />
            ))}
          </div>
        )}

        <div className="text-center mt-4 d-flex justify-content-center gap-2 flex-wrap">
          <Link to="/testimonials" className="btn btn-dark px-4">
            {t("home.testimonials.actions.more", "Voir plus")}
          </Link>
          <Link to="/testimonials" className="btn btn-outline-dark px-4">
            {t("home.testimonials.actions.leaveReview", "Laisser un avis")}
          </Link>
        </div>
      </div>
    </section>
  );
}
