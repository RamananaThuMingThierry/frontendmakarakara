import { Link } from "react-router-dom";

export default function About() {
  return (
    <main className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        {/* HERO */}
        <div className="row align-items-center g-4 mb-5">
          <div className="col-12 col-lg-6">
            <h1 className="fw-bold mb-2">
              À propos de <span className="text-warning">MAHAKARAKARA</span>
            </h1>
            <p className="text-secondary mb-3">
              MAHAKARAKARA propose des produits capillaires naturels pensés pour sublimer
              tous les types de cheveux. Qualité professionnelle, ingrédients choisis,
              et une expérience d’achat simple et fiable.
            </p>

            <div className="d-flex flex-wrap gap-2">
              <Link to="/shop" className="btn btn-dark">
                Voir la boutique
              </Link>
              <Link to="/contact" className="btn btn-outline-dark">
                Nous contacter
              </Link>
            </div>

            <div className="d-flex gap-4 mt-4">
              <div>
                <div className="fw-bold">+1000</div>
                <div className="text-secondary small">Clients satisfaits</div>
              </div>
              <div>
                <div className="fw-bold">Livraison</div>
                <div className="text-secondary small">Rapide & sécurisée</div>
              </div>
              <div>
                <div className="fw-bold">Support</div>
                <div className="text-secondary small">Humain & réactif</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="bg-white rounded-4 shadow-sm overflow-hidden">
              <img
                src="/website/images/slide_3.jpg"
                alt="MAHAKARAKARA"
                className="w-100"
                style={{ height: 360, objectFit: "cover" }}
                onError={(e) => (e.currentTarget.src = "/images/placeholder-product.png")}
              />
            </div>
          </div>
        </div>

        {/* VALUES */}
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-2">Nos engagements</h2>
          <p className="text-secondary mb-0">
            Ce qui guide MAHAKARAKARA au quotidien.
          </p>
        </div>

        <div className="row g-4 mb-5">
          {[
            {
              icon: "bi-leaf",
              title: "Ingrédients choisis",
              text: "Formules inspirées du naturel, adaptées à une routine simple et efficace.",
            },
            {
              icon: "bi-award",
              title: "Qualité professionnelle",
              text: "Des produits pensés pour la performance et le résultat, en toute confiance.",
            },
            {
              icon: "bi-truck",
              title: "Livraison fiable",
              text: "Expédition rapide et suivi. Objectif : recevoir votre commande sans stress.",
            },
            {
              icon: "bi-headset",
              title: "Support humain",
              text: "Une équipe disponible pour vous conseiller et répondre à vos questions.",
            },
          ].map((v) => (
            <div className="col-12 col-md-6 col-lg-3" key={v.title}>
              <div className="bg-white rounded-4 shadow-sm p-4 h-100">
                <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                     style={{ width: 44, height: 44, background: "#f4e6bd" }}>
                  <i className={`bi ${v.icon} fs-5`}></i>
                </div>
                <h6 className="fw-semibold">{v.title}</h6>
                <p className="text-secondary mb-0">{v.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* STORY + PROCESS */}
        <div className="row g-4 mb-5">
          <div className="col-12 col-lg-6">
            <div className="bg-white rounded-4 shadow-sm p-4 h-100">
              <h5 className="fw-bold mb-2">Notre histoire</h5>
              <p className="text-secondary mb-0">
                MAHAKARAKARA est né d’une idée simple : proposer des produits capillaires
                accessibles, efficaces et agréables à utiliser, tout en valorisant
                des ingrédients et des routines adaptées à notre quotidien.
              </p>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="bg-white rounded-4 shadow-sm p-4 h-100">
              <h5 className="fw-bold mb-3">Comment ça marche ?</h5>
              <div className="d-flex flex-column gap-3">
                {[
                  { n: "1", t: "Choisissez vos produits", d: "Par catégorie, best sellers ou nouveautés." },
                  { n: "2", t: "Renseignez la livraison", d: "Adresse + (optionnel) position GPS." },
                  { n: "3", t: "Payez facilement", d: "Espèce à la livraison ou mobile money." },
                ].map((s) => (
                  <div key={s.n} className="d-flex gap-3">
                    <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center"
                         style={{ width: 30, height: 30, flex: "0 0 30px" }}>
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

        {/* CTA */}
        <div className="bg-dark text-light rounded-4 p-4 p-lg-5 d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3">
          <div>
            <h4 className="fw-bold mb-1">Prêt(e) à découvrir MAHAKARAKARA ?</h4>
            <p className="text-secondary mb-0">
              Parcourez la boutique et trouvez la routine idéale.
            </p>
          </div>
          <div className="d-flex gap-2">
            <Link to="/shop" className="btn btn-warning fw-semibold">
              Voir les produits
            </Link>
            <Link to="/contact" className="btn btn-outline-light">
              Poser une question
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
