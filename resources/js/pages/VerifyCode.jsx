import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/website/AuthContext";

export default function VerifyCode() {
  const { verifyResetCode, loading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  // email envoyé depuis ForgotPassword via navigation state
  const emailFromState = location.state?.email || "";
  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return alert("Veuillez entrer votre email.");
    if (code.trim().length < 4) return alert("Veuillez entrer le code reçu.");

    const res = await verifyResetCode({ email, code });
    if (!res.ok) return alert(res.message || "Code invalide");

    // on passe au reset password avec un token (ou juste email+code si ton backend préfère)
    nav("/reset-password", { replace: true, state: { resetToken: res.resetToken , email } });
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="rounded-2 shadow-sm p-4" style={{ background: "#fbf7ec" }}>
        <h2 className="fw-bold mb-1">Vérification du code</h2>
        <p className="text-secondary mb-4">
          Entrez le code reçu par email pour continuer.
        </p>

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

          <div>
            <label className="form-label">Code</label>
            <input
              className="form-control text-center"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Ex: 123456"
              inputMode="numeric"
              maxLength={6}
              style={{ letterSpacing: "0.35em", fontWeight: 700 }}
            />
            <div className="text-secondary small mt-1">
              Code à 6 chiffres (si ton code est différent, enlève le “slice(0, 6)”).
            </div>
          </div>

          <button className="btn btn-dark fw-semibold" disabled={loading} type="submit">
            {loading ? "Vérification..." : "Vérifier"}
          </button>

          <div className="text-secondary small d-flex justify-content-between">
            <Link to="/forgot-password">Renvoyer / changer email</Link>
            <Link to="/login">Connexion</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
