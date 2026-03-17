import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";

export default function EmailVerifyPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Vérification en cours...");

  useEffect(() => {
    const verifyUrl = searchParams.get("verify_url");

    if (!verifyUrl) {
      setStatus("error");
      setMessage("Lien de vérification manquant.");
      return;
    }

    axios
      .get(verifyUrl)
      .then((response) => {
        setStatus("success");
        setMessage(response.data.message || "Votre email a bien été vérifié.");
      })
      .catch((error) => {
        setStatus("error");
        setMessage(
          error?.response?.data?.message ||
            "Le lien est invalide, expiré ou la vérification a échoué."
        );
      });
  }, [searchParams]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1>
          {status === "loading" && "Vérification..."}
          {status === "success" && "Email vérifié"}
          {status === "error" && "Erreur de vérification"}
        </h1>

        <p>{message}</p>

        {status !== "loading" && (
          <Link to="/login" style={styles.button}>
            Aller à la connexion
          </Link>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f4f6f8",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "500px",
    background: "#fff",
    borderRadius: "12px",
    padding: "32px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  button: {
    display: "inline-block",
    marginTop: "20px",
    padding: "12px 20px",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    textDecoration: "none",
  },
};
