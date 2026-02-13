import { Link } from "react-router-dom";

export default function TestimonialSection() {
  const testimonials = [
    {
      name: "Sarah R.",
      role: "Customer",
      image: "/website/images/c1.jpg",
      text: "Service rapide et résultat incroyable. Je recommande à 100%.",
      rating: 5,
    },
    {
      name: "Kevin M.",
      role: "Customer",
      image: "/website/images/c2.jpg",
      text: "Très bonne qualité, équipe sérieuse et super réactive.",
      rating: 5,
    },
    {
      name: "Nina A.",
      role: "Customer",
      image: "/website/images/c3.jpg",
      text: "Franchement top ! Je suis très satisfaite du rendu final.",
      rating: 4,
    },
    {
      name: "Daniel T.",
      role: "Customer",
      image: "/website/images/c4.jpg",
      text: "Expérience parfaite du début à la fin. Merci !",
      rating: 5,
    },
    {
      name: "Laura P.",
      role: "Customer",
      image: "/website/images/c5.jpg",
      text: "Le support est excellent et les résultats sont réels.",
      rating: 5,
    },
  ];

  const Card = ({ t }) => (
    <div className="col-12 col-md-4">
      <div className="p-4 rounded-4 shadow-sm h-100" style={{ background: "#fbf7ec" }}>

        {/* Avatar + name */}
        <div className="d-flex align-items-center mb-3">
          <img
            src={t.image}
            alt={t.name}
            className="rounded-circle me-3"
            style={{
              width: 56,
              height: 56,
              objectFit: "cover",
              border: "2px solid #fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
            }}
          />

          <div>
            <div className="fw-bold">{t.name}</div>
            <div className="text-secondary small">{t.role}</div>
          </div>
        </div>

        {/* Stars */}
        <div className="text-warning mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <i key={i} className={`bi ${i < t.rating ? "bi-star-fill" : "bi-star"}`} />
          ))}
        </div>

        {/* Text */}
        <p className="text-secondary mb-0">“{t.text}”</p>
      </div>
    </div>
  );

  return (
    <section className="py-5">
      <div className="container">

        <div className="text-center mb-4">
          <h3 className="fw-bold" style={{ fontFamily: "cursive" }}>
            Témoignages
          </h3>
          <p className="text-secondary mb-0">
            Ce que nos clients disent de nous
          </p>
        </div>

        <div className="row g-3">
          {testimonials.slice(0, 3).map((t, i) => (
            <Card key={i} t={t} />
          ))}
        </div>

        <div className="text-center mt-4">
          <Link to="/testimonials" className="btn btn-dark px-4">
            Voir plus
          </Link>
        </div>

      </div>
    </section>
  );
}
