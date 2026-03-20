import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/website/AuthContext";

export default function ForgotPassword() {
  const { forgotPassword, loading } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    const res = await forgotPassword({ email: email.trim() });

    if (!res.ok) {
      setMessage(res.message || "Echec de l'envoi du code.");
      return;
    }

    nav("/verify-code", {
      state: {
        email: email.trim(),
        expiresInMinutes: res.expiresInMinutes ?? 15,
        flashMessage: res.message,
      },
    });
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="rounded-2 shadow-sm p-4" style={{ background: "#fbf7ec" }}>
        <h2 className="fw-bold mb-1">Mot de passe oublie</h2>
        <p className="text-secondary mb-4">
          Entrez votre email et nous vous enverrons un code de verification valable 15 minutes.
        </p>

        {message ? <div className="alert alert-danger py-2">{message}</div> : null}

        <form onSubmit={submit} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label">Email</label>
            <input
              className="form-control"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@gmail.com"
              required
            />
          </div>

          <button className="btn btn-dark fw-semibold" disabled={loading} type="submit">
            {loading ? "Envoi..." : "Envoyer le code"}
          </button>

          <div className="text-secondary small">
            <Link to="/login">Retour</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
