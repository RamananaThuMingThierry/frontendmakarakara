import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/website/AuthContext";

export default function ResetPassword() {
  const { resetPassword, loading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  const code = location.state?.code || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !code) {
      setError("Session de reinitialisation invalide. Recommencez la procedure.");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    const res = await resetPassword({ email, code, password });

    if (!res.ok) {
      setError(
        res.errors?.password?.[0] ||
          res.errors?.code?.[0] ||
          res.errors?.email?.[0] ||
          res.message ||
          "Echec de la reinitialisation."
      );
      return;
    }

    nav("/login", {
      replace: true,
      state: { message: res.message || "Mot de passe mis a jour." },
    });
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="rounded-2 shadow-sm p-4" style={{ background: "#fbf7ec" }}>
        <h2 className="fw-bold mb-1">Nouveau mot de passe</h2>
        <p className="text-secondary mb-4">Choisissez un nouveau mot de passe pour votre compte.</p>

        {error ? <div className="alert alert-danger py-2">{error}</div> : null}

        <form onSubmit={submit} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label">Nouveau mot de passe</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control pe-5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 10,
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "#6c757d",
                }}
                aria-label={showPassword ? "Masquer" : "Afficher"}
              >
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">Confirmer le mot de passe</label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                className="form-control pe-5"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 10,
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "#6c757d",
                }}
                aria-label={showConfirm ? "Masquer" : "Afficher"}
              >
                <i className={`bi ${showConfirm ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>
          </div>

          <button className="btn btn-dark fw-semibold" disabled={loading} type="submit">
            {loading ? "Mise a jour..." : "Mettre a jour"}
          </button>

          <div className="text-secondary small">
            <Link to="/login">Retour connexion</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
