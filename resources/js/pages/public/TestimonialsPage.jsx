import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { publicTestimonialsApi } from "../../api/public_testimonials";
import "../../../css/website.css";

const PAGE_SIZE = 5;

const initialForm = {
  name: "",
  city: "",
  product_used: "",
  rating: "",
  message: "",
  photo_url: null,
};

function buildImageUrl(path) {
  if (!path) return "/images/img.png";
  if (/^https?:\/\//i.test(path)) return path;

  const apiUrl = import.meta.env.VITE_API_URL;
  const base = apiUrl.replace(/\/api\/?$/, "");
  return `${base}/${String(path).replace(/^\/+/, "")}`;
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");

  async function load({ mode = "initial" } = {}) {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);

    setError("");
    try {
      const data = await publicTestimonialsApi.list();
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Impossible de charger les avis.");
    } finally {
      if (mode === "initial") setLoading(false);
      else setRefreshing(false);
    }
  }

  useEffect(() => {
    load({ mode: "initial" });
  }, []);

  const totalPages = Math.max(1, Math.ceil(testimonials.length / PAGE_SIZE));

  const currentItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return testimonials.slice(start, start + PAGE_SIZE);
  }, [page, testimonials]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }

    if (serverError) setServerError("");
    if (successMessage) setSuccessMessage("");
  };

  const resetForm = () => {
    setForm(initialForm);
    setErrors({});
    setServerError("");
    setSuccessMessage("");
    setPhotoPreview("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setErrors({});
    setServerError("");
    setSuccessMessage("");

    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("city", form.city.trim());
    payload.append("product_used", form.product_used.trim());
    payload.append("rating", form.rating === "" ? "" : String(form.rating));
    payload.append("message", form.message.trim());

    if (form.photo_url instanceof File) {
      payload.append("photo_url", form.photo_url);
    }

    try {
      const { data, message } = await publicTestimonialsApi.create(payload);
      if (data?.id) {
        setTestimonials((current) => [data, ...current.filter((item) => item.id !== data.id)]);
        setPage(1);
      } else {
        await load({ mode: "refresh" });
      }
      setForm(initialForm);
      setErrors({});
      setServerError("");
      setPhotoPreview("");
      setSuccessMessage(message || "Votre avis a ete publie.");
    } catch (err) {
      const response = err?.response;
      if (response?.data?.errors) {
        setErrors(response.data.errors);
      }
      setServerError(response?.data?.message || "Erreur lors de l'envoi de votre avis.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="py-5 bg-light">
      <div className="container" style={{ maxWidth: 1100 }}>
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontFamily: "cursive" }}>
              Tous les temoignages
            </h2>
            <p className="text-secondary mb-0">
              {loading ? "Chargement..." : `${testimonials.length} avis publies`} - Page {page}/{totalPages}
            </p>
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-dark"
              onClick={() => load({ mode: "refresh" })}
              disabled={loading || refreshing}
            >
              {loading || refreshing ? "Actualisation..." : "Actualiser"}
            </button>
            <Link to="/" className="btn btn-dark">
              Retour
            </Link>
          </div>
        </div>

        <div className="row g-4 mb-5">
          <div className="col-12 col-lg-7">
            <div className="bg-white rounded-4 shadow-sm p-4 h-100">
              <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                <div>
                  <h4 className="fw-bold mb-1">Avis clients</h4>
                  <p className="text-secondary mb-0">Les derniers avis publies en direct.</p>
                </div>
              </div>

              {error ? <div className="alert alert-danger">{error}</div> : null}

              {loading ? (
                <div className="d-flex align-items-center gap-2 text-muted">
                  <span className="spinner-border spinner-border-sm" />
                  Chargement des avis...
                </div>
              ) : currentItems.length === 0 ? (
                <div className="text-center text-muted py-5">Aucun avis publie pour le moment.</div>
              ) : (
                <>
                  <div className="row g-3">
                    {currentItems.map((t) => (
                      <div key={t.id} className="col-12">
                        <div className="p-4 rounded-4 shadow-sm h-100 testimonial-card bg-light">
                          <div className="d-flex align-items-center mb-3">
                            <img
                              src={buildImageUrl(t.photo_url)}
                              alt={t.name}
                              className="rounded-circle me-3"
                              style={{
                                width: 60,
                                height: 60,
                                objectFit: "cover",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                              }}
                            />

                            <div>
                              <div className="fw-bold">{t.name}</div>
                              <div className="text-secondary small">
                                {t.city || "Client"} {t.product_used ? `- ${t.product_used}` : ""}
                              </div>
                            </div>
                          </div>

                          <div className="text-warning mb-2">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <i
                                key={idx}
                                className={`bi ${idx < Number(t.rating || 0) ? "bi-star-fill" : "bi-star"}`}
                              />
                            ))}
                          </div>

                          <p className="text-secondary mb-0">"{t.message}"</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <ul className="pagination mb-0">
                        <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => goTo(page - 1)}>
                            <i className="bi bi-chevron-double-left"></i>
                          </button>
                        </li>

                        {Array.from({ length: totalPages }).map((_, idx) => (
                          <li key={idx} className={`page-item ${page === idx + 1 ? "active" : ""}`}>
                            <button className="page-link" onClick={() => goTo(idx + 1)}>
                              {idx + 1}
                            </button>
                          </li>
                        ))}

                        <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => goTo(page + 1)}>
                            <i className="bi bi-chevron-double-right"></i>
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="bg-white rounded-4 shadow-sm p-4">
              <h4 className="fw-bold mb-2">Laisser votre avis</h4>
              <p className="text-secondary">
                Partagez votre experience. Votre avis apparaitra directement dans la liste.
              </p>

              {successMessage ? <div className="alert alert-success alert-dismissible fade show">
                {successMessage}
                  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div> : null}

              <form onSubmit={submit} className="row g-3" noValidate>
                <div className="col-12">
                  <label className="form-label">Nom *</label>
                  <input
                    className={`form-control ${errors.name ? "is-invalid" : ""}`}
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    disabled={sending}
                  />
                  {errors.name ? <div className="invalid-feedback">{errors.name[0]}</div> : null}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Ville</label>
                  <input
                    className={`form-control ${errors.city ? "is-invalid" : ""}`}
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    disabled={sending}
                  />
                  {errors.city ? <div className="invalid-feedback">{errors.city[0]}</div> : null}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Note</label>
                  <select
                    className={`form-select ${errors.rating ? "is-invalid" : ""}`}
                    value={form.rating}
                    onChange={(e) => update("rating", e.target.value)}
                    disabled={sending}
                  >
                    <option value="">Choisir</option>
                    <option value="5">5 etoiles</option>
                    <option value="4">4 etoiles</option>
                    <option value="3">3 etoiles</option>
                    <option value="2">2 etoiles</option>
                    <option value="1">1 etoile</option>
                  </select>
                  {errors.rating ? <div className="invalid-feedback">{errors.rating[0]}</div> : null}
                </div>

                <div className="col-12">
                  <label className="form-label">Produit utilise</label>
                  <input
                    className={`form-control ${errors.product_used ? "is-invalid" : ""}`}
                    value={form.product_used}
                    onChange={(e) => update("product_used", e.target.value)}
                    disabled={sending}
                  />
                  {errors.product_used ? (
                    <div className="invalid-feedback">{errors.product_used[0]}</div>
                  ) : null}
                </div>

                <div className="col-12">
                  <label className="form-label">Votre avis *</label>
                  <textarea
                    rows={5}
                    className={`form-control ${errors.message ? "is-invalid" : ""}`}
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    disabled={sending}
                  />
                  {errors.message ? <div className="invalid-feedback">{errors.message[0]}</div> : null}
                </div>

                <div className="col-12">
                  <label className="form-label">Photo (optionnel)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className={`form-control ${errors.photo_url ? "is-invalid" : ""}`}
                    disabled={sending}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      update("photo_url", file);
                      setPhotoPreview(file ? URL.createObjectURL(file) : "");
                    }}
                  />
                  {errors.photo_url ? (
                    <div className="invalid-feedback">{errors.photo_url[0]}</div>
                  ) : null}
                </div>

                {photoPreview ? (
                  <div className="col-12">
                    <img
                      src={photoPreview}
                      alt="Apercu"
                      className="img-fluid rounded-3 border"
                      style={{ maxHeight: 180, objectFit: "cover" }}
                    />
                  </div>
                ) : null}

                <div className="col-12 d-flex flex-column flex-sm-row gap-2">
                  <button className="btn btn-warning fw-semibold" type="submit" disabled={sending}>
                    {sending ? "Envoi en cours..." : "Envoyer mon avis"}
                  </button>
                  <button className="btn btn-outline-dark" type="button" onClick={resetForm} disabled={sending}>
                    Reinitialiser
                  </button>
                </div>

                <small className="text-secondary">
                  Merci pour votre retour. Votre avis s'affiche juste apres l'envoi.
                </small>
              </form>
            </div>
          </div>
        </div>

        <div className="text-center text-secondary small mt-4">Merci pour votre confiance.</div>
      </div>
    </div>
  );
}
