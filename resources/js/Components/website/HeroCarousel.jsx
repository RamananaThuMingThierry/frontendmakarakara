export default function HeroCarousel() {
  const slides = [
    {
      id: 1,
      image: "/website/images/slide_1.jpg",
      title: "Sublimez vos cheveux",
      text:
        "Découvrez notre gamme exclusive de soins capillaires et accessoires de qualité professionnelle.",
      button: { label: "Découvrir la collection", href: "/shop" },
    },
    {
      id: 2,
      image: "/website/images/slide_2.jpg",
      title: "Nouveautés & Best sellers",
      text: "Les produits préférés de nos clientes, disponibles maintenant.",
      button: { label: "Voir la boutique", href: "/shop" },
    },
    {
      id: 3,
      image: "/website/images/slide_3.jpg",
      title: "Nouveautés & Best sellers",
      text: "Les produits préférés de nos clientes, disponibles maintenant.",
      button: { label: "Voir la boutique", href: "/shop" },
    },
  ];

  return (
    <section className="position-relative">
      <div
        id="heroCarousel"
        className="carousel slide"
        data-bs-ride="carousel"
        data-bs-interval="5000"
      >
        {/* Indicators */}
        <div className="carousel-indicators">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              data-bs-target="#heroCarousel"
              data-bs-slide-to={i}
              className={i === 0 ? "active" : ""}
              aria-current={i === 0 ? "true" : undefined}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Slides */}
        <div className="carousel-inner">
          {slides.map((s, i) => (
            <div key={s.id} className={`carousel-item ${i === 0 ? "active" : ""}`}>
              {/* Image */}
              <img
                src={s.image}
                className="d-block w-100"
                alt={s.title}
                style={{ height: "750px", objectFit: "cover" }}
              />

              {/* Overlay content */}
              <div className="carousel-caption text-start">
                <div className="container">
                  <div className="col-12 col-lg-6">
                    <h1 className="display-5 fw-bold">{s.title}</h1>
                    <p className="lead">{s.text}</p>
                    <a className="btn btn-dark px-4" href={s.button.href}>
                      {s.button.label}
                    </a>

                    {/* Mini stats (optionnel) */}
                    <div className="d-flex gap-4 mt-4">
                      <div>
                        <div className="fw-bold">5000+</div>
                        <small className="text-white-50">Clients satisfaits</small>
                      </div>
                      <div>
                        <div className="fw-bold">5000+</div>
                        <small className="text-white-50">Clients satisfaits</small>
                      </div>
                      <div>
                        <div className="fw-bold">5000+</div>
                        <small className="text-white-50">Clients satisfaits</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dark overlay for readability */}
              <div
                className="position-absolute top-0 start-0 w-100 h-100"
                style={{ background: "rgba(0,0,0,0.25)" }}
              />
            </div>
          ))}
        </div>

        {/* Controls */}
        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#heroCarousel"
          data-bs-slide="prev"
        >
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Previous</span>
        </button>

        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#heroCarousel"
          data-bs-slide="next"
        >
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Next</span>
        </button>
      </div>
    </section>
  );
}
