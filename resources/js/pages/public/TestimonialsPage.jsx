import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import '../../../css/website.css';

export default function TestimonialsPage() {
  const testimonials = [
    { name: "Sarah R.", role: "Customer", image: "/website/images/c1.jpg", text: "Service rapide et résultat incroyable.", rating: 5 },
    { name: "Kevin M.", role: "Customer", image: "/website/images/c2.jpg", text: "Très bonne qualité et équipe sérieuse.", rating: 5 },
    { name: "Nina A.", role: "Customer", image: "/website/images/c3.jpg", text: "Franchement top !", rating: 4 },
    { name: "Daniel T.", role: "Customer", image: "/website/images/c4.jpg", text: "Expérience parfaite du début à la fin.", rating: 5 },
    { name: "Laura P.", role: "Customer", image: "/website/images/c5.jpg", text: "Support excellent.", rating: 5 },
    { name: "Hery L.", role: "Customer", image: "/website/images/c6.jpg", text: "Super rapide !", rating: 5 },
    { name: "Mina K.", role: "Customer", image: "/website/images/c7.jpg", text: "Très professionnel.", rating: 4 },
    { name: "Alex B.", role: "Customer", image: "/website/images/c8.jpg", text: "Service incroyable.", rating: 5 },
    { name: "Julie F.", role: "Customer", image: "/images/img.png", text: "Je recommande fortement.", rating: 5 },
    { name: "Mark D.", role: "Customer", image: "/images/img.png", text: "Très satisfait.", rating: 5 },
  ];

  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(testimonials.length / PAGE_SIZE);

  const currentItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return testimonials.slice(start, start + PAGE_SIZE);
  }, [page]);

  const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  return (
    <div className="py-5 bg-light">
      <div className="container" style={{ maxWidth: 1100 }}>

        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontFamily: "cursive" }}>
              Tous les témoignages
            </h2>
            <p className="text-secondary mb-0">
              {testimonials.length} avis • Page {page}/{totalPages}
            </p>
          </div>

          <Link to="/" className="btn btn-outline-dark">
            Retour
          </Link>
        </div>

        {/* Grid */}
        <div className="row g-3">
          {currentItems.map((t, i) => (
            <div key={i} className="col-12 col-md-4">
              <div className="p-4 rounded-4 shadow-sm h-100 testimonial-card bg-white">

                {/* Avatar */}
                <div className="d-flex align-items-center mb-3">
                  <img
                    src={t.image}
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
                    <div className="text-secondary small">{t.role}</div>
                  </div>
                </div>

                {/* Stars */}
                <div className="text-warning mb-2">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <i key={idx} className={`bi ${idx < t.rating ? "bi-star-fill" : "bi-star"}`} />
                  ))}
                </div>

                <p className="text-secondary mb-0">“{t.text}”</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <ul className="pagination mb-0">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => goTo(page - 1)}>
                  Précédent
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
                  Suivant
                </button>
              </li>
            </ul>
          </div>
        )}

        <div className="text-center text-secondary small mt-4">
          Merci pour votre confiance ❤️
        </div>

      </div>
    </div>
  );
}
