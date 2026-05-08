import { Link } from "react-router-dom";

function resolveTone(statusCode) {
  if (statusCode >= 500) {
    return {
      badge: "Erreur serveur",
      accent: "#8f2d2d",
      glow: "rgba(143, 45, 45, 0.18)",
      panel: "linear-gradient(135deg, #fff8f4 0%, #ffffff 55%, #f8e6d9 100%)",
    };
  }

  return {
    badge: "Page introuvable",
    accent: "#8b6a16",
    glow: "rgba(139, 106, 22, 0.18)",
    panel: "linear-gradient(135deg, #fffcee 0%, #ffffff 55%, #f3ecd3 100%)",
  };
}

export default function ErrorStatusPage({
  statusCode = 500,
  title = "Une erreur est survenue",
  message = "Nous n'avons pas pu afficher cette page correctement.",
  showRetry = false,
  onRetry,
}) {
  const tone = resolveTone(statusCode);

  return (
    <section className="error-screen">
      <div className="error-screen__backdrop" />
      <div className="container py-5">
        <div
          className="error-screen__panel mx-auto shadow-lg"
          style={{ "--error-accent": tone.accent, "--error-glow": tone.glow, "--error-panel": tone.panel }}
        >
          <span className="error-screen__badge">{tone.badge}</span>
          <p className="error-screen__code">{statusCode}</p>
          <h1 className="error-screen__title">{title}</h1>
          <p className="error-screen__message">{message}</p>

          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <Link className="btn btn-dark px-4" to="/">
              Retour a l'accueil
            </Link>

            {showRetry ? (
              <button type="button" className="btn btn-outline-dark px-4" onClick={onRetry}>
                Reessayer
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
