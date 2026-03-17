import { Link } from "react-router-dom";
import { galleryClients } from "../../data/galleryClients";

export default function GalleryClients() {
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
              Tous les resultats de notre communaute
            </p>
          </div>

          <Link to="/" className="btn btn-outline-dark btn-sm">
            Retour
          </Link>
        </div>

        {/* Grid */}
        <div className="row g-3">
          {galleryClients.map((image) => (
            <div key={image.id} className="col-6 col-md-3">
              <div className="client-card position-relative overflow-hidden rounded-4">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-100 h-100 object-fit-cover"
                  style={{ height: 220 }}
                  loading="lazy"
                />

                <div className="overlay d-flex align-items-center justify-content-center">
                  <div className="text-center text-white">
                    <i className="bi bi-heart-fill fs-4"></i>
                    <div className="small mt-1">100</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Small footer */}
        <div className="text-center text-secondary small mt-4">
          {galleryClients.length} photos
        </div>
      </div>
    </div>
  );
}
