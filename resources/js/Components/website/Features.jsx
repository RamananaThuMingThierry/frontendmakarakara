export default function Features() {
  const items = [
    {
      icon: "bi-truck",
      title: "Livraison GPS",
      text: "Suivi en temps réel de votre commande avec géolocalisation précise",
    },
    {
      icon: "bi-shield-check",
      title: "Qualité Garantie",
      text: "Tous nos produits sont certifiés et de qualité professionnelle",
    },
    {
      icon: "bi-arrow-counterclockwise",
      title: "Retour Facile",
      text: "30 jours pour retourner votre produit si vous n’êtes pas satisfait",
    },
    {
      icon: "bi-headset",
      title: "Support 24/7",
      text: "Notre équipe est disponible pour vous accompagner à tout moment",
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
