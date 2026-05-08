import ErrorStatusPage from "./ErrorStatusPage";

export default function NotFoundPage() {
  return (
    <ErrorStatusPage
      statusCode={404}
      title="Cette page n'existe pas"
      message="Le lien demande est introuvable ou n'est plus disponible."
    />
  );
}
