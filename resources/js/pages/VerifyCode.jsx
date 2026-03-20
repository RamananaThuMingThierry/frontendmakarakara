import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/website/AuthContext";

export default function VerifyCode() {
  const { verifyResetCode, forgotPassword, loading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const emailFromState = location.state?.email || "";
  const expiresInMinutes = location.state?.expiresInMinutes ?? 15;
  const flashMessage = location.state?.flashMessage || "";

  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState(flashMessage);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();

    if (!trimmedEmail) {
      setError("Veuillez entrer votre email.");
      return;
    }

    if (trimmedCode.length !== 6) {
      setError("Veuillez entrer le code a 6 chiffres.");
      return;
    }

    const res = await verifyResetCode({ email: trimmedEmail, code: trimmedCode });

    if (!res.ok) {
      setError(res.errors?.code?.[0] || res.message || "Code invalide.");
      return;
    }

    nav("/reset-password", {
      replace: true,
      state: { email: trimmedEmail, code: trimmedCode },
    });
  };

  const resendCode = async () => {
    setMessage("");
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Entrez votre email avant de renvoyer le code.");
      return;
    }

    const res = await forgotPassword({ email: trimmedEmail });

    if (!res.ok) {
      setError(res.message || "Impossible de renvoyer le code.");
      return;
    }

    setMessage(res.message || "Un nouveau code a ete envoye.");
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="rounded-2 shadow-sm p-4" style={{ background: "#fbf7ec" }}>
        <h2 className="fw-bold mb-1">Verification du code</h2>
        <p className="text-secondary mb-4">
          Entrez le code recu par email. Il reste valable {expiresInMinutes} minutes.
        </p>

        {message ? <div className="alert alert-success py-2">{message}</div> : null}
        {error ? <div className="alert alert-danger py-2">{error}</div> : null}

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

          <div>
            <label className="form-label">Code</label>
            <input
              className="form-control text-center"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              required
              style={{ letterSpacing: "0.35em", fontWeight: 700 }}
            />
          </div>

          <button className="btn btn-dark fw-semibold" disabled={loading} type="submit">
            {loading ? "Verification..." : "Verifier le code"}
          </button>

          <button className="btn btn-outline-dark" disabled={loading} onClick={resendCode} type="button">
            Renvoyer le code
          </button>

          <div className="text-secondary small d-flex justify-content-between">
            <Link to="/forgot-password">Changer email</Link>
            <Link to="/login">Connexion</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
