import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { useI18n } from "../hooks/website/I18nContext";

export default function EmailVerifyPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage(t("emailVerifyPage.messages.loading", "Verification en cours..."));
  }, [t]);

  useEffect(() => {
    const verifyUrl = searchParams.get("verify_url");

    if (!verifyUrl) {
      setStatus("error");
      setMessage(t("emailVerifyPage.messages.missingLink", "Lien de verification manquant."));
      return;
    }

    axios
      .get(verifyUrl)
      .then((response) => {
        setStatus("success");
        setMessage(
          response.data.message ||
            t("emailVerifyPage.messages.success", "Votre email a bien ete verifie.")
        );
      })
      .catch((error) => {
        setStatus("error");
        setMessage(
          error?.response?.data?.message ||
            t(
              "emailVerifyPage.messages.error",
              "Le lien est invalide, expire ou la verification a echoue."
            )
        );
      });
  }, [searchParams, t]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1>
          {status === "loading" && t("emailVerifyPage.title.loading", "Verification...")}
          {status === "success" && t("emailVerifyPage.title.success", "Email verifie")}
          {status === "error" && t("emailVerifyPage.title.error", "Erreur de verification")}
        </h1>

        <p>{message}</p>

        {status !== "loading" && (
          <Link to="/login" style={styles.button}>
            {t("emailVerifyPage.actions.goLogin", "Aller a la connexion")}
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
