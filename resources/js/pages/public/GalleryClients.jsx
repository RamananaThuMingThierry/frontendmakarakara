import { Link } from "react-router-dom";

export default function GalleryClients() {
  const images = [
    "/website/images/c1.jpg",
    "/website/images/c2.jpg",
    "/website/images/c3.jpg",
    "/website/images/c4.jpg",
    "/website/images/c5.jpg",
    "/website/images/c6.jpg",
    "/website/images/c7.jpg",
    "/website/images/c8.jpg",
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
    <div className="py-5 bg-light">
      <div className="container" style={{ maxWidth: 1100 }}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ fontFamily: "cursive" }}>
              Galerie Clients
            </h2>
            <p className="text-secondary mb-0">
              Tous les résultats de notre communauté
            </p>
          </div>

          <Link to="/" className="btn btn-outline-dark btn-sm">
            Retour
          </Link>
        </div>

        {/* Grid */}
        <div className="row g-3">
          {images.map((src, i) => (
            <div key={i} className="col-6 col-md-3">
              <div className="client-card position-relative overflow-hidden rounded-4">
                <img
                  src={src}
                  alt={`Client ${i + 1}`}
                  className="w-100 h-100 object-fit-cover"
                  style={{ height: 220 }}
                  loading="lazy"
                />

                <div className="overlay d-flex align-items-center justify-content-center">
                  <i className="bi bi-heart-fill text-white fs-4"></i>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Small footer */}
        <div className="text-center text-secondary small mt-4">
          {images.length} photos
        </div>
      </div>
    </div>
  );
}
