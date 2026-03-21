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
        <h2 className="fw-bold mb-1">Mot de passe oublié</h2>
        <p className="text-secondary mb-4">
          Entrez votre email et nous vous enverrons un code de vérification valable 15 minutes.
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

          <div className="d-flex justify-content-between align-items-center gap-1">
                      <Link
                to="/login"
                className="btn btn-outline-dark btn-sm d-inline-flex align-items-center gap-2"
            >
                <i className="bi bi-arrow-left"></i>
                Annuler
            </Link>
            <button
                className="btn btn-sm btn-warning fw-semibold w-100"
                disabled={loading}
                type="submit"
            >
                {loading ? "Envoi..." : "Envoyer le code"}
            </button>


            </div>
        </form>
      </div>
    </div>
  );
}
