import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/website/AuthContext";
import { useI18n } from "../hooks/website/I18nContext";

export default function VerifyCode() {
  const { t } = useI18n();
  const { verifyResetCode, forgotPassword, loading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const emailFromState = location.state?.email || "";
  const expiresInMinutes = location.state?.expiresInMinutes ?? 15;
  const flashMessage = location.state?.flashMessage || "";

  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState(flashMessage);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();

    if (!trimmedEmail) {
      setError(t("verifyCode.errors.emailRequired", "Please enter your email."));
      return;
    }

    if (trimmedCode.length !== 6) {
      setError(t("verifyCode.errors.codeLength", "Please enter the 6-digit code."));
      return;
    }

    const res = await verifyResetCode({ email: trimmedEmail, code: trimmedCode });

    if (!res.ok) {
      setError(res.errors?.code?.[0] || res.message || t("verifyCode.errors.invalid", "Invalid code."));
      return;
    }

    nav("/reset-password", {
      replace: true,
      state: { email: trimmedEmail, code: trimmedCode },
    });
  };

  const resendCode = async () => {
    setMessage("");
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t("verifyCode.errors.emailBeforeResend", "Enter your email before resending the code."));
      return;
    }

    const res = await forgotPassword({ email: trimmedEmail });

    if (!res.ok) {
      setError(res.message || t("verifyCode.errors.resendFailed", "Unable to resend the code."));
      return;
    }

    setMessage(res.message || t("verifyCode.success.resent", "A new code has been sent."));
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="rounded-2 shadow-sm p-4" style={{ background: "#fbf7ec" }}>
        <h2 className="fw-bold mb-1">{t("verifyCode.title", "Code verification")}</h2>
        <p className="text-secondary mb-4">
          {t("verifyCode.subtitle", "Enter the code received by email. It remains valid for")}{" "}
          {expiresInMinutes} {t("verifyCode.minutes", "minutes")}.
        </p>

        {message ? <div className="alert alert-success py-2">{message}</div> : null}
        {error ? <div className="alert alert-danger py-2">{error}</div> : null}

        <form onSubmit={submit} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label">{t("verifyCode.fields.email", "Email")}</label>
            <input
              className="form-control"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("verifyCode.placeholders.email", "email@gmail.com")}
              required
            />
          </div>

          <div>
            <label className="form-label">{t("verifyCode.fields.code", "Code")}</label>
            <input
              className="form-control text-center"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder={t("verifyCode.placeholders.code", "123456")}
              inputMode="numeric"
              maxLength={6}
              required
              style={{ letterSpacing: "0.35em", fontWeight: 700 }}
            />
          </div>

          <button className="btn btn-dark fw-semibold" disabled={loading} type="submit">
            {loading
              ? t("verifyCode.actions.loading", "Verifying...")
              : t("verifyCode.actions.submit", "Verify code")}
          </button>

          <button className="btn btn-outline-dark" disabled={loading} onClick={resendCode} type="button">
            {t("verifyCode.actions.resend", "Resend code")}
          </button>

          <div className="text-secondary small d-flex justify-content-between">
            <Link to="/forgot-password">{t("verifyCode.actions.changeEmail", "Change email")}</Link>
            <Link to="/login">{t("verifyCode.actions.login", "Login")}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
