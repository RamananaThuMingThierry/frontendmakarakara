import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/website/AuthContext";
import { useI18n } from "../hooks/website/I18nContext";

export default function ForgotPassword() {
  const { t } = useI18n();
  const { forgotPassword, loading } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    const res = await forgotPassword({ email: email.trim() });

    if (!res.ok) {
      setMessage(res.message || t("forgotPassword.errors.sendFailed", "Failed to send the code."));
      return;
    }

    nav("/verify-code", {
      state: {
        email: email.trim(),
        expiresInMinutes: res.expiresInMinutes ?? 15,
        flashMessage: res.message,
      },
    });
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="rounded-2 shadow-sm p-4" style={{ background: "#fbf7ec" }}>
        <h2 className="fw-bold mb-1">{t("forgotPassword.title", "Forgot password")}</h2>
        <p className="text-secondary mb-4">
          {t(
            "forgotPassword.subtitle",
            "Enter your email and we will send you a verification code valid for 15 minutes."
          )}
        </p>

        {message ? <div className="alert alert-danger py-2">{message}</div> : null}

        <form onSubmit={submit} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label">{t("forgotPassword.fields.email", "Email")}</label>
            <input
              className="form-control"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("forgotPassword.placeholders.email", "email@gmail.com")}
              required
            />
          </div>

          <div className="d-flex justify-content-between align-items-center gap-1">
            <Link
              to="/login"
              className="btn btn-outline-dark btn-sm d-inline-flex align-items-center gap-2"
            >
              <i className="bi bi-arrow-left"></i>
              {t("forgotPassword.actions.cancel", "Cancel")}
            </Link>
            <button className="btn btn-sm btn-warning fw-semibold w-100" disabled={loading} type="submit">
              {loading
                ? t("forgotPassword.actions.loading", "Sending...")
                : t("forgotPassword.actions.submit", "Send code")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
