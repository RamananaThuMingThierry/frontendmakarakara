import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/website/AuthContext";
import { useI18n } from "../hooks/website/I18nContext";

export default function ResetPassword() {
  const { t } = useI18n();
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
      setError(
        t("resetPassword.errors.invalidSession", "Invalid reset session. Please start the process again.")
      );
      return;
    }

    if (password.length < 8) {
      setError(t("resetPassword.errors.passwordMin", "Password must contain at least 8 characters."));
      return;
    }

    if (password !== confirm) {
      setError(t("resetPassword.errors.passwordMismatch", "Passwords do not match."));
      return;
    }

    const res = await resetPassword({ email, code, password });

    if (!res.ok) {
      setError(
        res.errors?.password?.[0] ||
          res.errors?.code?.[0] ||
          res.errors?.email?.[0] ||
          res.message ||
          t("resetPassword.errors.failed", "Reset failed.")
      );
      return;
    }

    nav("/login", {
      replace: true,
      state: { message: res.message || t("resetPassword.success", "Password updated.") },
    });
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="rounded-2 shadow-sm p-4" style={{ background: "#fbf7ec" }}>
        <h2 className="fw-bold mb-1">{t("resetPassword.title", "New password")}</h2>
        <p className="text-secondary mb-4">
          {t("resetPassword.subtitle", "Choose a new password for your account.")}
        </p>

        {error ? <div className="alert alert-danger py-2">{error}</div> : null}

        <form onSubmit={submit} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label">{t("resetPassword.fields.password", "New password")}</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control pe-5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("resetPassword.placeholders.password", "........")}
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
                aria-label={
                  showPassword
                    ? t("resetPassword.actions.hidePassword", "Hide")
                    : t("resetPassword.actions.showPassword", "Show")
                }
              >
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">
              {t("resetPassword.fields.confirmPassword", "Confirm password")}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                className="form-control pe-5"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t("resetPassword.placeholders.password", "........")}
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
                aria-label={
                  showConfirm
                    ? t("resetPassword.actions.hidePassword", "Hide")
                    : t("resetPassword.actions.showPassword", "Show")
                }
              >
                <i className={`bi ${showConfirm ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>
          </div>

          <button className="btn btn-dark fw-semibold" disabled={loading} type="submit">
            {loading
              ? t("resetPassword.actions.loading", "Updating...")
              : t("resetPassword.actions.submit", "Update")}
          </button>

          <div className="text-secondary small">
            <Link to="/login">{t("resetPassword.backToLogin", "Back to login")}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
