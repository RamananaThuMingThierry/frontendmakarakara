import { Link } from "react-router-dom";
import { useI18n } from "../../hooks/website/I18nContext";

export default function About() {
  const { t } = useI18n();

  const values = [
    {
      icon: "bi-leaf",
      title: t("about.values.selectedIngredients.title", "Ingredients choisis"),
      text: t(
        "about.values.selectedIngredients.text",
        "Formules inspirees du naturel, adaptees a une routine simple et efficace."
      ),
    },
    {
      icon: "bi-award",
      title: t("about.values.professionalQuality.title", "Qualite professionnelle"),
      text: t(
        "about.values.professionalQuality.text",
        "Des produits penses pour la performance et le resultat, en toute confiance."
      ),
    },
    {
      icon: "bi-truck",
      title: t("about.values.reliableDelivery.title", "Livraison fiable"),
      text: t(
        "about.values.reliableDelivery.text",
        "Expedition rapide et suivi. Objectif : recevoir votre commande sans stress."
      ),
    },
    {
      icon: "bi-headset",
      title: t("about.values.humanSupport.title", "Support humain"),
      text: t(
        "about.values.humanSupport.text",
        "Une equipe disponible pour vous conseiller et repondre a vos questions."
      ),
    },
  ];

  const steps = [
    {
      n: "1",
      t: t("about.process.step1.title", "Choisissez vos produits"),
      d: t("about.process.step1.text", "Par categorie, best sellers ou nouveautes."),
    },
    {
      n: "2",
      t: t("about.process.step2.title", "Renseignez la livraison"),
      d: t("about.process.step2.text", "Adresse + (optionnel) position GPS."),
    },
    {
      n: "3",
      t: t("about.process.step3.title", "Payez facilement"),
      d: t("about.process.step3.text", "Espece a la livraison ou mobile money."),
    },
  ];

  return (
    <main className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        <div className="row align-items-center g-4 mb-5">
          <div className="col-12 col-lg-6">
            <h1 className="fw-bold mb-2">
              {t("about.hero.titlePrefix", "A propos de")}{" "}
              <span className="text-warning">MAHAKARAKARA</span>
            </h1>
            <p className="text-secondary mb-3">
              {t(
                "about.hero.text",
                "MAHAKARAKARA propose des produits capillaires naturels penses pour sublimer tous les types de cheveux. Qualite professionnelle, ingredients choisis, et une experience d'achat simple et fiable."
              )}
            </p>

            <div className="d-flex flex-wrap gap-2">
              <Link to="/shop" className="btn btn-dark">
                {t("about.actions.shop", "Voir la boutique")}
              </Link>
              <Link to="/contact" className="btn btn-outline-dark">
                {t("about.actions.contact", "Nous contacter")}
              </Link>
            </div>

            <div className="d-flex gap-4 mt-4">
              <div>
                <div className="fw-bold">+1000</div>
                <div className="text-secondary small">
                  {t("about.stats.clients", "Clients satisfaits")}
                </div>
              </div>
              <div>
                <div className="fw-bold">{t("about.stats.deliveryTitle", "Livraison")}</div>
                <div className="text-secondary small">
                  {t("about.stats.deliveryText", "Rapide & securisee")}
                </div>
              </div>
              <div>
                <div className="fw-bold">{t("about.stats.supportTitle", "Support")}</div>
                <div className="text-secondary small">
                  {t("about.stats.supportText", "Humain & reactif")}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="bg-white rounded-4 shadow-sm overflow-hidden">
              <img
                src="/website/images/slide_3.jpg"
                alt={t("about.hero.imageAlt", "MAHAKARAKARA")}
                className="w-100"
                style={{ height: 360, objectFit: "cover" }}
                onError={(e) => (e.currentTarget.src = "/images/placeholder-product.png")}
              />
            </div>
          </div>
        </div>

        <div className="text-center mb-4">
          <h2 className="fw-bold mb-2">{t("about.valuesTitle", "Nos engagements")}</h2>
          <p className="text-secondary mb-0">
            {t("about.valuesSubtitle", "Ce qui guide MAHAKARAKARA au quotidien.")}
          </p>
        </div>

        <div className="row g-4 mb-5">
          {values.map((v) => (
            <div className="col-12 col-md-6 col-lg-3" key={v.title}>
              <div className="bg-white rounded-4 shadow-sm p-4 h-100">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                  style={{ width: 44, height: 44, background: "#f4e6bd" }}
                >
                  <i className={`bi ${v.icon} fs-5`}></i>
                </div>
                <h6 className="fw-semibold">{v.title}</h6>
                <p className="text-secondary mb-0">{v.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-4 mb-5">
          <div className="col-12 col-lg-6">
            <div className="bg-white rounded-4 shadow-sm p-4 h-100">
              <h5 className="fw-bold mb-2">{t("about.story.title", "Notre histoire")}</h5>
              <p className="text-secondary mb-0">
                {t(
                  "about.story.text",
                  "MAHAKARAKARA est ne d'une idee simple : proposer des produits capillaires accessibles, efficaces et agreables a utiliser, tout en valorisant des ingredients et des routines adaptees a notre quotidien."
                )}
              </p>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="bg-white rounded-4 shadow-sm p-4 h-100">
              <h5 className="fw-bold mb-3">{t("about.process.title", "Comment ca marche ?")}</h5>
              <div className="d-flex flex-column gap-3">
                {steps.map((s) => (
                  <div key={s.n} className="d-flex gap-3">
                    <div
                      className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center"
                      style={{ width: 30, height: 30, flex: "0 0 30px" }}
                    >
                      {s.n}
                    </div>
                    <div>
                      <div className="fw-semibold">{s.t}</div>
                      <div className="text-secondary small">{s.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-dark text-light rounded-4 p-4 p-lg-5 d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3">
          <div>
            <h4 className="fw-bold mb-1">
              {t("about.cta.title", "Pret(e) a decouvrir MAHAKARAKARA ?")}
            </h4>
            <p className="text-secondary mb-0">
              {t("about.cta.text", "Parcourez la boutique et trouvez la routine ideale.")}
            </p>
          </div>
          <div className="d-flex gap-2">
            <Link to="/shop" className="btn btn-warning fw-semibold">
              {t("about.cta.shop", "Voir les produits")}
            </Link>
            <Link to="/contact" className="btn btn-outline-light">
              {t("about.cta.question", "Poser une question")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
