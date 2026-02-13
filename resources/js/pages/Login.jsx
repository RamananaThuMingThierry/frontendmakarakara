import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/website/AuthContext";

export default function Login() {
  const { isAuth, login, loading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // ✅ NEW

  if (isAuth) {
    nav("/account", { replace: true });
  }

  const submit = async (e) => {
    e.preventDefault();

    const res = await login({ email, password, rememberMe }); // ✅ send rememberMe
    if (!res.ok) return alert(res.message || "Connexion échouée");

    const redirectTo = location.state?.from || "/account";
    nav(redirectTo, { replace: true });
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="rounded-2 shadow-sm p-4" style={{ background: "#fbf7ec" }}>
        <h2 className="fw-bold mb-1">Connexion</h2>
        <p className="text-secondary mb-4">Accédez à votre compte.</p>

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
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "10px",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "#6c757d",
                }}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* ✅ Remember me + Forgot password */}
          <div className="d-flex align-items-center justify-content-between">
            <label className="d-flex align-items-center gap-2 small text-secondary m-0">
              <input
                type="checkbox"
                className="form-check-input m-0"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)} 
              />
              Se souvenir de moi
            </label>

            <Link className="small" to="/forgot-password">
              Mot de passe oublié ?
            </Link>
          </div>

          <button className="btn btn-dark fw-semibold" disabled={loading} type="submit">
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          <div className="text-secondary small">
            Pas de compte ? <Link to="/register">Créer un compte</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
