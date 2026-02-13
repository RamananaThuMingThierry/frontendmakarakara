import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/website/AuthContext";

export default function ForgotPassword() {
  const { forgotPassword, loading } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const res = await forgotPassword({ email });
    if (!res.ok) return alert(res.message || "Échec de l'envoi");

    setSent(true);
    nav("/verify-code", { state: { email } });
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="rounded-2 shadow-sm p-4" style={{ background: "#fbf7ec" }}>
        <h2 className="fw-bold mb-1">Mot de passe oublié</h2>
        <p className="text-secondary mb-4">
          Entrez votre email et nous vous enverrons un lien de réinitialisation.
        </p>

        {sent ? (
          <div className="alert alert-success">
            Si cet email existe, un lien de réinitialisation a été envoyé.
            <div className="mt-3">
              <Link to="/login">Retour à la connexion</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="d-flex flex-column gap-3">
            <div>
              <label className="form-label">Email</label>
              <input
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@gmail.com"
              />
            </div>

            <button className="btn btn-dark fw-semibold" disabled={loading} type="submit">
              {loading ? "Envoi..." : "Envoyer le lien"}
            </button>

            <div className="text-secondary small">
              <Link to="/login">Retour</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
