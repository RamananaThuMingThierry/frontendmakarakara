import { useI18n } from "../../hooks/website/I18nContext";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="pt-5 pb-3 bg-dark text-light">
      <div className="container">
        <div className="row g-4">
          <div className="col-12 col-lg-4">
            <h5 className="fw-bold text-warning">MAHAKARAKARA</h5>
            <p className="text-secondary">
              {t(
                "footer.description",
                "Produits capillaires naturels pour sublimer vos cheveux. Qualite professionnelle, livraison rapide, support humain."
              )}
            </p>

            <div className="d-flex gap-3 fs-5">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="bi bi-facebook text-primary"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <i className="bi bi-instagram text-danger"></i>
              </a>
              <a href="https://wa.me/261329790536" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <i className="bi bi-whatsapp text-success"></i>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <i className="bi bi-tiktok"></i>
              </a>
            </div>
          </div>

          <div className="col-6 col-lg-2">
            <h6 className="fw-semibold mb-3">{t("footer.shop.title", "Boutique")}</h6>
            <ul className="list-unstyled text-secondary">
              <li>{t("footer.shop.cities.antananarivo", "Antananarivo")}</li>
              <li>{t("footer.shop.cities.antalaha", "Antalaha")}</li>
              <li>{t("footer.shop.cities.diegoSuarez", "Diego Suarez")}</li>
            </ul>
          </div>

          <div className="col-6 col-lg-3">
            <h6 className="fw-semibold mb-3">{t("footer.support.title", "Support")}</h6>
            <ul className="list-unstyled text-secondary">
              <li>{t("footer.support.contact", "Contact")}</li>
              <li>{t("footer.support.delivery", "Livraison")}</li>
              <li>{t("footer.support.returns", "Retours")}</li>
              <li>{t("footer.support.faq", "FAQ")}</li>
            </ul>
          </div>

          <div className="col-12 col-lg-3">
            <h6 className="fw-semibold mb-3">{t("footer.contact.title", "Contact")}</h6>

            <p className="text-secondary mb-1">
              <a href="mailto:tiafinjaran@gmail.com" className="text-secondary text-decoration-none">
                <i className="bi bi-envelope me-2 text-warning"></i>
                tiafinjaran@gmail.com
              </a>
            </p>

            <p className="text-secondary mb-1">
              <a href="tel:+261329790536" className="text-secondary text-decoration-none">
                <i className="bi bi-telephone me-2 text-warning"></i>
                +261 32 97 905 36
              </a>
            </p>

            <p className="text-secondary">
              <a
                href="https://www.google.com/maps/search/?api=1&query=VT+29+RAI+Bis+Ampahateza+Antananarivo+Madagascar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary text-decoration-none"
              >
                <i className="bi bi-geo-alt me-2 text-warning"></i>
                {t("footer.contact.address", "VT 29 RAI Bis Ampahateza, Antananarivo, Madagascar")}
              </a>
            </p>
          </div>
        </div>

        <hr className="border-secondary my-4" />

        <div className="d-flex flex-column flex-md-row justify-content-between text-secondary small">
          <span>
            &copy; {new Date().getFullYear()} <span className="fw-bold">MAHAKARAKARA</span>.{" "}
            {t("footer.rights", "Tous droits reserves.")}
          </span>
          <span>{t("footer.fastDelivery", "Livraison rapide")}</span>
        </div>
      </div>
    </footer>
  );
}
