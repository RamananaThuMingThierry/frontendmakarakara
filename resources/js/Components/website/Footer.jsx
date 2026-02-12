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
              <i className="bi bi-facebook text-primary"></i>
              <i className="bi bi-instagram text-danger"></i>
              <i className="bi bi-whatsapp text-success"></i>
              <i className="bi bi-tiktok"></i>
            </div>
          </div>

          {/* Shop links */}
          <div className="col-6 col-lg-2">
            <h6 className="fw-semibold mb-3">Boutique</h6>
            <ul className="list-unstyled text-secondary">
              <li>Soins capillaires</li>
              <li>Accessoires</li>
              <li>Nouveautés</li>
              <li>Best sellers</li>
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
            <p className="text-secondary mb-1">
              <i className="bi bi-envelope me-2 text-warning"></i>
              tiafinjaran@gmail.com
            </p>
            <p className="text-secondary mb-1">
              <i className="bi bi-telephone me-2 text-warning"></i>
              +261 32 97 905 36
            </p>
            <p className="text-secondary">
              <i className="bi bi-geo-alt me-2 text-warning"></i>
              VT 29 RAI Bis Ampahateza, Antananarivo, Madagascar
            </p>
          </div>

        </div>

        <hr className="border-secondary my-4" />

        <div className="d-flex flex-column flex-md-row justify-content-between text-secondary small">
          <span>© {new Date().getFullYear()} <span className="fw-bold">MAHAKARAKARA</span>. Tous droits réservés.</span>
          <span>Livraison rapide • Retour 30 jours</span>
        </div>

      </div>
    </footer>
  );
}
