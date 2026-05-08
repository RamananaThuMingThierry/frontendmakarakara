import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import ErrorStatusPage from "./ErrorStatusPage";

export default function RouteErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    const statusCode = Number(error.status || 500);

    return (
      <ErrorStatusPage
        statusCode={statusCode}
        title={statusCode === 404 ? "Cette page n'existe pas" : "Impossible d'afficher cette page"}
        message={
          statusCode === 404
            ? "Le contenu demande est introuvable."
            : "Une erreur inattendue bloque le chargement de cette page."
        }
        showRetry={statusCode >= 500}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <ErrorStatusPage
      statusCode={500}
      title="Impossible d'afficher cette page"
      message="Une erreur inattendue s'est produite pendant le chargement ou le rendu."
      showRetry
      onRetry={() => window.location.reload()}
    />
  );
}
