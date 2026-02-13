import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/website/AuthContext";

export default function Register() {
  const { isAuth, register, loading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // si déjà connecté → account
  if (isAuth) {
    nav("/account", { replace: true });
  }

  const submit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return alert("Veuillez entrer votre nom.");
    if (!email.trim()) return alert("Veuillez entrer votre email.");
    if (password.length < 6) return alert("Mot de passe: 6 caractères minimum.");
    if (password !== confirm) return alert("Les mots de passe ne correspondent pas.");

    const res = await register({ name, email, password });
    if (!res.ok) return alert(res.message || "Création de compte échouée");

    const redirectTo = location.state?.from || "/account";
    nav(redirectTo, { replace: true });
  };

  const Eye = ({ open }) => (
    <span style={{ fontSize: 18, color: "#6c757d", userSelect: "none" }}>
      {open ? "🙈" : "👁"}
    </span>
  );

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="rounded-2 shadow-sm p-4" style={{ background: "#fbf7ec" }}>
        <h2 className="fw-bold mb-1">Créer un compte</h2>
        <p className="text-secondary mb-4">Rejoignez-nous en quelques secondes.</p>

        <form onSubmit={submit} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label">Nom <span className="text-danger">*</span></label>
            <input
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
            />
          </div>

          <div>
            <label className="form-label">Email <span className="text-danger">*</span></label>
            <input
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@gmail.com"
            />
          </div>

          <div>
            <label className="form-label">Contact</label>
            <input
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@gmail.com"
            />
          </div>

          <div>
            <label className="form-label">Mot de passe</label>
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
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="btn p-0"
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 14,
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                }}
              >
                <Eye open={showPassword} />
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
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="btn p-0"
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 14,
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                }}
              >
              </button>
            </div>
          </div>

          <button className="btn btn-dark fw-semibold" disabled={loading} type="submit">
            {loading ? "Création..." : "Créer un compte"}
          </button>

          <div className="text-secondary small">
            Déjà un compte ? <Link to="/login">Se connecter</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
