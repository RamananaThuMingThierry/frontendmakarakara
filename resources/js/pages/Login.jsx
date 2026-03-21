import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/website/AuthContext";

function resolveRedirectTarget(roles, fromPath) {
  const safeRoles = Array.isArray(roles) ? roles : [];
  const isAdmin = safeRoles.includes("admin");
  const isDelivery = safeRoles.includes("delivery");
  const isCustomer = safeRoles.includes("customer");

  if (isAdmin) {
    if (fromPath && fromPath.startsWith("/admin")) return fromPath;
    return "/admin";
  }

  if (isDelivery) {
    if (fromPath && fromPath.startsWith("/delivery")) return fromPath;
    return "/delivery";
  }

  if (isCustomer) {
    if (fromPath && !fromPath.startsWith("/admin") && !fromPath.startsWith("/delivery")) {
      return fromPath;
    }

    return "/";
  }

  return "/";
}

export default function Login() {
  const { isAuth, login, loading, hydrating, roles } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [flashMessage, setFlashMessage] = useState(() => location.state?.message || "");

  useEffect(() => {
    const nextMessage = location.state?.message;
    if (!nextMessage) return;

    setFlashMessage(nextMessage);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  if (hydrating) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  if (isAuth) {
    const r = Array.isArray(roles) ? roles : [];
    const from = location.state?.from?.pathname;

    if (r.length === 0) {
      return (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border" role="status" />
        </div>
      );
    }

    const target = resolveRedirectTarget(r, from);

    return <Navigate to={target} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    const res = await login({ email, password, rememberMe });

    if (!res.ok) {
      if (res.errors) setErrors(res.errors);
      else setGlobalError(res.message || "Connexion echouee");
      return;
    }

    const target = resolveRedirectTarget(res.roles, location.state?.from?.pathname);
    navigate(target, { replace: true });
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="rounded-2 shadow-sm p-4" style={{ background: "#fbf7ec" }}>
        <h2 className="fw-bold mb-1">Connexion</h2>
        <p className="text-secondary mb-3">Accédéz à votre compte.</p>

        {flashMessage && <div className="alert alert-success py-2">{flashMessage}</div>}
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
                placeholder="........"
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
                {showPassword ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
              </button>
            </div>
            {errors.password && <span className="text-danger">{errors.password[0]}</span>}
          </div>

          <div className="d-flex align-items-center justify-content-between">
            <label className="d-flex align-items-center gap-2 text-secondary m-0">
              <input
                type="checkbox"
                className="form-check-input m-0"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Se souvenir de moi
            </label>

            <Link className="small text-decoration-none" to="/forgot-password">
              Mot de passe oublie ?
            </Link>
          </div>

          <button className="btn btn-dark fw-semibold" disabled={loading} type="submit">
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          <div className="text-secondary small">
            Pas de compte ? <Link to="/register" className="text-decoration-none">Créer un compte</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
