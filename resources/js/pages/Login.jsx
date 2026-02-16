import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/website/AuthContext";

export default function Login() {
  const { isAuth, login, loading, hydrating, roles } = useAuth();
  const location = useLocation();

  // si session en cours de restauration, on attend
  if (hydrating) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  // déjà connecté
  if (isAuth) {
    const r = Array.isArray(roles) ? roles : [];
    const from = location.state?.from?.pathname;

    // si tu dépends des roles pour admin/delivery
    if (r.length === 0) {
      return (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border" role="status" />
        </div>
      );
    }

    let target = from;
    if (!target) {
      if (r.includes("admin")) target = "/admin";
      else if (r.includes("delivery")) target = "/delivery";
      else target = "/";
    }

    return <Navigate to={target} replace />;
  }


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    const res = await login({ email, password, rememberMe });

    if (!res.ok) {
      if (res.errors) setErrors(res.errors);
      else setGlobalError(res.message || "Connexion échouée");
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="rounded-2 shadow-sm p-4" style={{ background: "#fbf7ec" }}>
        <h2 className="fw-bold mb-1">Connexion</h2>
        <p className="text-secondary mb-3">Accédez à votre compte.</p>

        {globalError && <div className="alert alert-danger py-2">{globalError}</div>}

        <form onSubmit={submit} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label">Email</label>
            <input
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@gmail.com"
            />
            {errors.email && <span className="text-danger small">{errors.email[0]}</span>}
          </div>

          <div>
            <label className="form-label">Mot de passe</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className={`form-control pe-5 ${errors.password ? "is-invalid" : ""}`}
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
                  right: "20px",
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
            {errors.password && <span className="text-danger small">{errors.password[0]}</span>}
          </div>

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
