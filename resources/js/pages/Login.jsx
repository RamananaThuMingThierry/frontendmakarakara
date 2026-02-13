import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/website/AuthContext";

export default function Login() {
  const { isAuth, login, loading, roles } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    if (!isAuth) return;

    const r = Array.isArray(roles) ? roles : [];

    if (r.includes("admin")) nav("/admin", { replace: true });
    else if (r.includes("delivery")) nav("/delivery", { replace: true });
    else nav("/account", { replace: true });

  }, [isAuth, roles, nav]);


  const submit = async (e) => {
    e.preventDefault();

    setErrors({});
    setGlobalError("");

    const res = await login({ email, password, rememberMe });

    if (!res.ok) {
      // erreurs validation Laravel
      if (res.errors) setErrors(res.errors);
      else setGlobalError(res.message || "Connexion échouée");
      return;
    }

    const roles = res.roles || [];

    if (roles.includes("admin")) nav("/admin", { replace: true });
    else if (roles.includes("delivery")) nav("/delivery", { replace: true });
    else nav("/account", { replace: true });
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="rounded-2 shadow-sm p-4" style={{ background: "#fbf7ec" }}>
        <h2 className="fw-bold mb-1">Connexion</h2>

        <p className="text-secondary mb-3">Accédez à votre compte.</p>

        {/* ✅ Global error */}
        {globalError && (
          <div className="alert alert-danger py-2">{globalError}</div>
        )}

        <form onSubmit={submit} className="d-flex flex-column gap-3">
          {/* EMAIL */}
          <div>
            <label className="form-label">Email</label>
            <input
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@gmail.com"
            />
            {errors.email && (
              <span className="text-danger small">
                {errors.email[0]}
              </span>
            )}
          </div>

          {/* PASSWORD */}
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

            {errors.password && (
              <span className="text-danger small">
                {errors.password[0]}
              </span>
            )}
          </div>

          {/* Remember */}
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
