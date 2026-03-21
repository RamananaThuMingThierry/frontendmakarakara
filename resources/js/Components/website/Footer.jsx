export default function Footer() {
  return (
    <footer className="pt-5 pb-3 bg-dark text-light">
      <div className="container">

        <div className="row g-4">

          {/* Brand */}
          <div className="col-12 col-lg-4">
            <h5 className="fw-bold text-warning">MAHAKARAKARA</h5>
            <p className="text-secondary">
              Produits capillaires naturels pour sublimer vos cheveux.
              Qualité professionnelle, livraison rapide, support humain.
            </p>

            <div className="d-flex gap-3 fs-5">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-facebook text-primary"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-instagram text-danger"></i>
              </a>
              <a href="https://wa.me/261329790536" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-whatsapp text-success"></i>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-tiktok"></i>
              </a>
            </div>
          </div>

          {/* Shop links */}
          <div className="col-6 col-lg-2">
            <h6 className="fw-semibold mb-3">Boutique</h6>
            <ul className="list-unstyled text-secondary">
              <li>Antananarivo</li>
              <li>Antalaha</li>
              <li>Diego Suárez</li>
            </ul>
          </div>

          {/* Support */}
          <div className="col-6 col-lg-3">
            <h6 className="fw-semibold mb-3">Support</h6>
            <ul className="list-unstyled text-secondary">
              <li>Contact</li>
              <li>Livraison</li>
              <li>Retours</li>
              <li>FAQ</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-12 col-lg-3">
            <h6 className="fw-semibold mb-3">Contact</h6>

            {/* Email */}
            <p className="text-secondary mb-1">
              <a href="mailto:tiafinjaran@gmail.com" className="text-secondary text-decoration-none">
                <i className="bi bi-envelope me-2 text-warning"></i>
                tiafinjaran@gmail.com
              </a>
            </p>

            {/* Phone */}
            <p className="text-secondary mb-1">
              <a href="tel:+261329790536" className="text-secondary text-decoration-none">
                <i className="bi bi-telephone me-2 text-warning"></i>
                +261 32 97 905 36
              </a>
            </p>

            {/* Adresse (Google Maps) */}
            <p className="text-secondary">
              <a
                href="https://www.google.com/maps/search/?api=1&query=VT+29+RAI+Bis+Ampahateza+Antananarivo+Madagascar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary text-decoration-none"
              >
                <i className="bi bi-geo-alt me-2 text-warning"></i>
                VT 29 RAI Bis Ampahateza, Antananarivo, Madagascar
              </a>
            </p>
          </div>

        </div>

        <hr className="border-secondary my-4" />

        <div className="d-flex flex-column flex-md-row justify-content-between text-secondary small">
          <span>© {new Date().getFullYear()} <span className="fw-bold">MAHAKARAKARA</span>. Tous droits réservés.</span>
          <span>Livraison rapide</span>
        </div>

      </div>
    </footer>
  );
}