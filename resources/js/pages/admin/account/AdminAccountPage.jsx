import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword, getAccount, resendVerificationEmail, updateAccount } from "../../../api/account";
import TranslatedFileInput from "../../../Components/common/TranslatedFileInput";
import { useAuth } from "../../../hooks/website/AuthContext";
import { useI18n } from "../../../hooks/website/I18nContext";

function buildAvatarUrl(path) {
  if (!path) return null;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  const base = apiUrl.replace(/\/api\/?$/, "");
  return `${base}/${String(path).replace(/^\/+/, "")}`;
}

export default function AdminAccountPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, replaceAuthUser, logoutAdmin } = useAuth();

  const [account, setAccount] = useState(user || null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: null,
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileStatus, setProfileStatus] = useState("success");
  const [passwordStatus, setPasswordStatus] = useState("success");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("info");

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      setLoading(true);
      setLoadError("");

      try {
        const data = await getAccount();
        if (cancelled) return;

        const nextUser = data?.user || null;
        const nextRoles = Array.isArray(data?.roles) ? data.roles : [];

        setAccount(nextUser);
        setRoles(nextRoles);
        replaceAuthUser(nextUser);
      } catch (error) {
        if (cancelled) return;
        setLoadError(error?.response?.data?.message || t("account.errors.load", "Unable to load the account."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAccount();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setProfileForm({
      name: account?.name || "",
      email: account?.email || "",
      phone: account?.phone || "",
      avatar: null,
    });
  }, [account]);

  useEffect(() => {
    setVerificationMessage("");
  }, [account?.email_verified_at, account?.email]);

  const avatarPreview = useMemo(() => {
    if (profileForm.avatar instanceof File) {
      return URL.createObjectURL(profileForm.avatar);
    }

    return buildAvatarUrl(account?.avatar);
  }, [account?.avatar, profileForm.avatar]);

  useEffect(() => {
    return () => {
      if (avatarPreview && profileForm.avatar instanceof File) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview, profileForm.avatar]);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileErrors({});
    setProfileMessage("");
    setProfileStatus("success");

    try {
      const data = await updateAccount(profileForm);
      const nextUser = data?.user || null;

      setAccount(nextUser);
      replaceAuthUser(nextUser);
      setProfileForm((prev) => ({ ...prev, avatar: null }));
      setProfileMessage(data?.message || t("account.toast.profileUpdated", "Information updated."));
    } catch (error) {
      setProfileStatus("danger");
      setProfileErrors(error?.response?.data?.errors || {});
      setProfileMessage(error?.response?.data?.message || t("account.toast.profileUpdateFailed", "Update failed."));
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordErrors({});
    setPasswordMessage("");
    setPasswordStatus("success");

    try {
      const data = await changePassword(passwordForm);
      setPasswordForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
      setPasswordMessage(data?.message || t("account.toast.passwordUpdated", "Password updated."));
      await logoutAdmin();
      navigate("/login", {
        replace: true,
        state: {
          message: data?.message || t("account.toast.passwordReconnect", "Password updated. Please sign in again."),
        },
      });
    } catch (error) {
      setPasswordStatus("danger");
      setPasswordErrors(error?.response?.data?.errors || {});
      setPasswordMessage(error?.response?.data?.message || t("account.toast.passwordUpdateFailed", "Password update failed."));
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleResendVerification() {
    setVerificationLoading(true);
    setVerificationMessage("");
    setVerificationStatus("info");

    try {
      const data = await resendVerificationEmail();
      setVerificationStatus(data?.verified ? "success" : "info");
      setVerificationMessage(data?.message || t("account.toast.verificationSent", "Verification email sent."));
    } catch (error) {
      setVerificationStatus("danger");
      setVerificationMessage(
        error?.response?.data?.message || t("account.toast.verificationFailed", "Unable to send the verification email.")
      );
    } finally {
      setVerificationLoading(false);
    }
  }

  return (
    <section className="admin-account-page">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">{t("account.title", "My account")}</h1>
          <p className="text-muted mb-0">{t("account.subtitle", "View and update your personal information.")}</p>
        </div>
      </div>

      {loadError ? <div className="alert alert-danger">{loadError}</div> : null}

      {loading ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body py-5 text-center">
            <div className="spinner-border spinner-border-sm me-2" />
            {t("account.loading", "Loading account...")}
          </div>
        </div>
      ) : (
        <div className="row g-4 align-items-start">
          <div className="col-12 col-xl-4">
            <div className="card border-0 shadow-sm admin-account-card">
              <div className="card-body p-4">
                <div className="admin-account-hero mb-4">
                  <div className="admin-account-avatar">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt={account?.name || t("account.profile.avatarAlt", "Avatar")} />
                    ) : (
                      <span>{(account?.name || "A").charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div>
                    <h2 className="h5 fw-bold mb-1">{account?.name || t("account.summary.adminFallback", "Administrator")}</h2>
                    <p className="text-muted mb-2">{account?.email || t("account.summary.emailUnavailable", "Email unavailable")}</p>
                    <div className="d-flex flex-wrap gap-2">
                      {(roles.length ? roles : ["admin"]).map((role) => (
                        <span key={role} className="badge rounded-pill text-bg-warning">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="admin-account-meta">
                  <div className="admin-account-meta-item">
                    <span className="text-muted">{t("account.summary.phone", "Phone")}</span>
                    <strong>{account?.phone || t("account.summary.notProvided", "Not provided")}</strong>
                  </div>
                  <div className="admin-account-meta-item">
                    <span className="text-muted">{t("account.summary.emailVerification", "Email verification")}</span>
                    <strong className={account?.email_verified_at ? "text-success" : "text-warning"}>
                      {account?.email_verified_at ? t("account.status.verified", "Verified") : t("account.status.pending", "Pending")}
                    </strong>
                  </div>
                </div>

                {!account?.email_verified_at ? (
                  <div className="alert alert-warning mt-4 mb-0">
                    <div className="fw-semibold mb-1">{t("account.verification.title", "Email not verified")}</div>
                    <div className="small mb-3">{t("account.verification.text", "Send a new verification email to validate this address.")}</div>
                    {verificationMessage ? (
                      <div className={`alert alert-${verificationStatus} py-2 mb-3`}>
                        {verificationMessage}
                      </div>
                    ) : null}
                    <button
                      className="btn btn-sm btn-dark"
                      type="button"
                      onClick={handleResendVerification}
                      disabled={verificationLoading}
                    >
                      {verificationLoading ? t("account.verification.sending", "Sending...") : t("account.verification.button", "Verify email")}
                    </button>
                  </div>
                ) : null}

                <div className="alert alert-light border mb-0 mt-4">
                  {t("account.verification.notice", "If you change your email address, a new verification will be required.")}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-8">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">
                <div className="mb-3">
                  <h2 className="h5 fw-bold mb-1">{t("account.profile.title", "User information")}</h2>
                  <p className="text-muted mb-0">{t("account.profile.subtitle", "Edit your admin profile without leaving the dashboard.")}</p>
                </div>

                {profileMessage ? <div className={`alert alert-${profileStatus} py-2`}>{profileMessage}</div> : null}

                <form onSubmit={handleProfileSubmit} className="row g-3">
                  <div className="col-12">
                    <label className="form-label">{t("account.profile.avatar", "Profile picture")}</label>
                    <TranslatedFileInput
                      accept=".jpg,.jpeg,.png"
                      error={profileErrors.avatar?.[0] || ""}
                      selectedText={profileForm.avatar?.name || ""}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          avatar: e.target.files?.[0] || null,
                        }))
                      }
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">{t("account.profile.name", "Full name")}</label>
                    <input
                      className={`form-control ${profileErrors.name ? "is-invalid" : ""}`}
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    {profileErrors.name ? <div className="invalid-feedback">{profileErrors.name[0]}</div> : null}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">{t("account.profile.email", "Email address")}</label>
                    <input
                      type="email"
                      className={`form-control ${profileErrors.email ? "is-invalid" : ""}`}
                      value={profileForm.email}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                    {profileErrors.email ? <div className="invalid-feedback">{profileErrors.email[0]}</div> : null}
                  </div>

                  <div className="col-12">
                    <label className="form-label">{t("account.profile.phone", "Phone")}</label>
                    <input
                      className={`form-control ${profileErrors.phone ? "is-invalid" : ""}`}
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+261 ..."
                    />
                    {profileErrors.phone ? <div className="invalid-feedback">{profileErrors.phone[0]}</div> : null}
                  </div>

                  <div className="col-12">
                    <button className="btn btn-dark px-4" type="submit" disabled={profileLoading}>
                      {profileLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          {t("account.actions.saving", "Saving...")}
                        </>
                      ) : (
                        t("account.actions.saveChanges", "Save changes")
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="mb-3">
                  <h2 className="h5 fw-bold mb-1">{t("account.password.title", "Change password")}</h2>
                  <p className="text-muted mb-0">{t("account.password.subtitle", "For security reasons, you will be signed out after the change.")}</p>
                </div>

                {passwordMessage ? <div className={`alert alert-${passwordStatus} py-2`}>{passwordMessage}</div> : null}

                <form onSubmit={handlePasswordSubmit} className="row g-3">
                  <div className="col-12">
                    <label className="form-label">{t("account.password.current", "Current password")}</label>
                    <input
                      type="password"
                      className={`form-control ${passwordErrors.current_password ? "is-invalid" : ""}`}
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))}
                    />
                    {passwordErrors.current_password ? (
                      <div className="invalid-feedback">{passwordErrors.current_password[0]}</div>
                    ) : null}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">{t("account.password.new", "New password")}</label>
                    <input
                      type="password"
                      className={`form-control ${passwordErrors.password ? "is-invalid" : ""}`}
                      value={passwordForm.password}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, password: e.target.value }))}
                    />
                    {passwordErrors.password ? <div className="invalid-feedback">{passwordErrors.password[0]}</div> : null}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">{t("account.password.confirmation", "Confirmation")}</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordForm.password_confirmation}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          password_confirmation: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="col-12">
                    <button className="btn btn-outline-dark px-4" type="submit" disabled={passwordLoading}>
                      {passwordLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          {t("account.actions.updating", "Updating...")}
                        </>
                      ) : (
                        t("account.actions.changePassword", "Change password")
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
