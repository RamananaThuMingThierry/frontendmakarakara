import { useI18n } from "../../hooks/website/I18nContext";

export default function Features() {
  const { t } = useI18n();

  const items = [
    {
      icon: "bi-truck",
      title: t("home.features.gps.title", "Livraison GPS"),
      text: t(
        "home.features.gps.text",
        "Suivi en temps reel de votre commande avec geolocalisation precise"
      ),
    },
    {
      icon: "bi-shield-check",
      title: t("home.features.quality.title", "Qualite Garantie"),
      text: t(
        "home.features.quality.text",
        "Tous nos produits sont certifies et de qualite professionnelle"
      ),
    },
    {
      icon: "bi-arrow-counterclockwise",
      title: t("home.features.return.title", "Retour Facile"),
      text: t(
        "home.features.return.text",
        "30 jours pour retourner votre produit si vous n'etes pas satisfait"
      ),
    },
    {
      icon: "bi-headset",
      title: t("home.features.support.title", "Support 24/7"),
      text: t(
        "home.features.support.text",
        "Notre equipe est disponible pour vous accompagner a tout moment"
      ),
    },
  ];

  return (
    <section className="py-4 py-lg-5 bg-white">
      <div className="container">
        <div className="row g-4">
          {items.map((it) => (
            <div className="col-12 col-md-6 col-lg-3" key={it.title}>
              <div className="text-center px-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                  style={{
                    width: 42,
                    height: 42,
                    backgroundColor: "#111",
                  }}
                >
                  <i className={`${it.icon} text-warning fs-5`} />
                </div>

                <h6 className="fw-semibold mb-2">{it.title}</h6>
                <p className="text-secondary small mb-0">{it.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
