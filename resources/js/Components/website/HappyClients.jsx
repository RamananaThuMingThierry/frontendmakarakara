import { Link } from 'react-router-dom';
import '../../../css/website.css';

export default function HappyClients() {
  const images = [
    "/website/images/c1.jpg",
    "/website/images/c2.jpg",
    "/website/images/c3.jpg",
    "/website/images/c4.jpg",
    "/website/images/c5.jpg",
    "/website/images/c6.jpg",
    "/website/images/c7.jpg",
    "/website/images/c8.jpg",
  ];

  return (
    <section className="py-5 bg-light">
      <div className="container">

        {/* Title */}
        <div className="text-center mb-4">
          <h3 className="fw-bold" style={{ fontFamily: "cursive" }}>
            Clients Satisfaits
          </h3>
          <p className="text-secondary mb-0">
            Découvrez les résultats réels de notre communauté
          </p>
        </div>

        {/* Grid */}
        <div className="row g-3">
          {images.map((src, i) => (
            <div key={i} className="col-6 col-md-3">
              <div className="client-card position-relative overflow-hidden rounded-4">
                <img
                  src={src}
                  alt="Client satisfait"
                  className="w-100 h-100 object-fit-cover"
                  style={{ height: 220 }}
                  loading="lazy"
                />

                {/* overlay */}
                <div className="overlay d-flex align-items-center justify-content-center">
                  <i className="bi bi-heart-fill text-white fs-4"></i>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-4">
          <Link class="btn btn-dark btn-sm px-4" to="/gallery">
            Voir plus de photos
          </Link>
        </div>

      </div>
    </section>
  );
}
