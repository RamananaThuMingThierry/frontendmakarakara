import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/website/AuthContext";

export default function ResetPassword() {
  const { resetPassword, loading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const resetToken = location.state?.resetToken || null;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!resetToken) return alert("Token manquant. Recommencez la procédure.");
    if (password.length < 6) return alert("Mot de passe: 6 caractères minimum.");
    if (password !== confirm) return alert("Les mots de passe ne correspondent pas.");

    const res = await resetPassword({ resetToken, newPassword: password });
    if (!res.ok) return alert(res.message || "Échec de la réinitialisation");

    alert("Mot de passe mis à jour !");
    nav("/login", { replace: true });
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="rounded-2 shadow-sm p-4" style={{ background: "#fbf7ec" }}>
        <h2 className="fw-bold mb-1">Nouveau mot de passe</h2>
        <p className="text-secondary mb-4">Choisissez un nouveau mot de passe.</p>

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
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">Confirmer</label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                className="form-control pe-5"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
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
                {showConfirm ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <button className="btn btn-dark fw-semibold" disabled={loading} type="submit">
            {loading ? "Mise à jour..." : "Mettre à jour"}
          </button>

          <div className="text-secondary small">
            <Link to="/login">Retour connexion</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
