import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/website/AuthContext";
import { useI18n } from "../hooks/website/I18nContext";

export default function Register() {
  const { t } = useI18n();
  const { isAuth, register, loading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (isAuth) {
    return <Navigate to="/account" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();

    setErrors({});
    setGlobalError("");

    if (!name.trim()) return setGlobalError(t("register.errors.nameRequired", "Please enter your name."));
    if (!email.trim()) return setGlobalError(t("register.errors.emailRequired", "Please enter your email."));
    if (password.length < 8) {
      return setGlobalError(t("register.errors.passwordMin", "Password: minimum 8 characters."));
    }
    if (password !== confirm) {
      return setGlobalError(t("register.errors.passwordMismatch", "Passwords do not match."));
    }

    const res = await register({ name, email, phone, password });
    if (!res.ok) {
      if (res.errors) setErrors(res.errors);
      else setGlobalError(res.message || t("register.errors.failed", "Account creation failed."));
      return;
    }

    const redirectTo = location.state?.from?.pathname || "/account";
    nav(redirectTo, { replace: true });
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="rounded-2 shadow-sm p-4" style={{ background: "#fbf7ec" }}>
        <h2 className="fw-bold mb-1">{t("register.title", "Create an account")}</h2>
        <p className="text-secondary mb-4">{t("register.subtitle", "Join us in just a few seconds.")}</p>
        {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}

        <form onSubmit={submit} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label">
              {t("register.fields.name", "Name")} <span className="text-danger">*</span>
            </label>
            <input
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("register.placeholders.name", "Your name")}
            />
            {errors.name ? <div className="invalid-feedback">{errors.name[0]}</div> : null}
          </div>

          <div>
            <label className="form-label">
              {t("register.fields.email", "Email")} <span className="text-danger">*</span>
            </label>
            <input
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("register.placeholders.email", "email@gmail.com")}
            />
            {errors.email ? <div className="invalid-feedback">{errors.email[0]}</div> : null}
          </div>

          <div>
            <label className="form-label">{t("register.fields.phone", "Contact")}</label>
            <input
              className={`form-control ${errors.phone ? "is-invalid" : ""}`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("register.placeholders.phone", "+261 34 00 000 00")}
            />
            {errors.phone ? <div className="invalid-feedback">{errors.phone[0]}</div> : null}
          </div>

          <div>
            <label className="form-label">{t("register.fields.password", "Password")}</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control pe-5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("register.placeholders.password", "........")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword
                    ? t("register.actions.hidePassword", "Hide password")
                    : t("register.actions.showPassword", "Show password")
                }
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
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} />
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">{t("register.fields.confirmPassword", "Confirm password")}</label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                className="form-control pe-5"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t("register.placeholders.password", "........")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={
                  showConfirm
                    ? t("register.actions.hidePassword", "Hide password")
                    : t("register.actions.showPassword", "Show password")
                }
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
                <i className={`bi ${showConfirm ? "bi-eye-slash" : "bi-eye"}`} />
              </button>
            </div>
          </div>

          <button className="btn btn-dark fw-semibold" disabled={loading} type="submit">
            {loading ? t("register.actions.loading", "Creating...") : t("register.actions.submit", "Create an account")}
          </button>

          <div className="text-secondary small">
            {t("register.loginPrompt", "Already have an account?")}{" "}
            <Link to="/login" className="text-decoration-none">
              {t("register.loginLink", "Sign in")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
