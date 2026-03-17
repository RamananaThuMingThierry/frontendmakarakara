import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword, getAccount, resendVerificationEmail, updateAccount } from "../../../api/account";
import { useAuth } from "../../../hooks/website/AuthContext";

function buildAvatarUrl(path) {
  if (!path) return null;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const apiUrl = import.meta.env.VITE_API_URL || "http://192.168.0.17:8000/api";
  const base = apiUrl.replace(/\/api\/?$/, "");
  return `${base}/${String(path).replace(/^\/+/, "")}`;
}

export default function AdminAccountPage() {
  const navigate = useNavigate();
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
        setLoadError(error?.response?.data?.message || "Impossible de charger le compte.");
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
      setProfileMessage(data?.message || "Informations mises a jour.");
    } catch (error) {
      setProfileStatus("danger");
      setProfileErrors(error?.response?.data?.errors || {});
      setProfileMessage(error?.response?.data?.message || "Mise a jour impossible.");
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
      setPasswordMessage(data?.message || "Mot de passe modifie.");
      await logoutAdmin();
      navigate("/login", {
        replace: true,
        state: {
          message: data?.message || "Mot de passe modifie. Veuillez vous reconnecter.",
        },
      });
    } catch (error) {
      setPasswordStatus("danger");
      setPasswordErrors(error?.response?.data?.errors || {});
      setPasswordMessage(error?.response?.data?.message || "Modification impossible.");
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
      setVerificationMessage(data?.message || "Email de verification envoye.");
    } catch (error) {
      setVerificationStatus("danger");
      setVerificationMessage(
        error?.response?.data?.message || "Envoi de l'email de verification impossible."
      );
    } finally {
      setVerificationLoading(false);
    }
  }

  return (
    <section className="admin-account-page">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Mon compte</h1>
          <p className="text-muted mb-0">Consultez et mettez a jour vos informations personnelles.</p>
        </div>
      </div>

      {loadError ? <div className="alert alert-danger">{loadError}</div> : null}

      {loading ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body py-5 text-center">
            <div className="spinner-border spinner-border-sm me-2" />
            Chargement du compte...
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
                      <img src={avatarPreview} alt={account?.name || "Avatar"} />
                    ) : (
                      <span>{(account?.name || "A").charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div>
                    <h2 className="h5 fw-bold mb-1">{account?.name || "Administrateur"}</h2>
                    <p className="text-muted mb-2">{account?.email || "Email non disponible"}</p>
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
                    <span className="text-muted">Telephone</span>
                    <strong>{account?.phone || "Non renseigne"}</strong>
                  </div>
                  <div className="admin-account-meta-item">
                    <span className="text-muted">Verification email</span>
                    <strong className={account?.email_verified_at ? "text-success" : "text-warning"}>
                      {account?.email_verified_at ? "Verifie" : "En attente"}
                    </strong>
                  </div>
                </div>

                {!account?.email_verified_at ? (
                  <div className="alert alert-warning mt-4 mb-0">
                    <div className="fw-semibold mb-1">Email non verifie</div>
                    <div className="small mb-3">
                      Envoyez un nouvel email de verification pour valider cette adresse.
                    </div>
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
                      {verificationLoading ? "Envoi..." : "Verifier l'email"}
                    </button>
                  </div>
                ) : null}

                <div className="alert alert-light border mb-0 mt-4">
                  Si vous changez votre adresse email, une nouvelle verification sera demandee.
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-8">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">
                <div className="mb-3">
                  <h2 className="h5 fw-bold mb-1">Informations utilisateur</h2>
                  <p className="text-muted mb-0">Modifiez votre profil admin sans quitter le tableau de bord.</p>
                </div>

                {profileMessage ? <div className={`alert alert-${profileStatus} py-2`}>{profileMessage}</div> : null}

                <form onSubmit={handleProfileSubmit} className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Photo de profil</label>
                    <input
                      type="file"
                      className={`form-control ${profileErrors.avatar ? "is-invalid" : ""}`}
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          avatar: e.target.files?.[0] || null,
                        }))
                      }
                    />
                    {profileErrors.avatar ? <div className="invalid-feedback">{profileErrors.avatar[0]}</div> : null}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Nom complet</label>
                    <input
                      className={`form-control ${profileErrors.name ? "is-invalid" : ""}`}
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    {profileErrors.name ? <div className="invalid-feedback">{profileErrors.name[0]}</div> : null}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Adresse email</label>
                    <input
                      type="email"
                      className={`form-control ${profileErrors.email ? "is-invalid" : ""}`}
                      value={profileForm.email}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                    {profileErrors.email ? <div className="invalid-feedback">{profileErrors.email[0]}</div> : null}
                  </div>

                  <div className="col-12">
                    <label className="form-label">Telephone</label>
                    <input
                      className={`form-control ${profileErrors.phone ? "is-invalid" : ""}`}
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+243 ..."
                    />
                    {profileErrors.phone ? <div className="invalid-feedback">{profileErrors.phone[0]}</div> : null}
                  </div>

                  <div className="col-12">
                    <button className="btn btn-dark px-4" type="submit" disabled={profileLoading}>
                      {profileLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Enregistrement...
                        </>
                      ) : (
                        "Enregistrer les modifications"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="mb-3">
                  <h2 className="h5 fw-bold mb-1">Changer le mot de passe</h2>
                  <p className="text-muted mb-0">
                    Pour des raisons de securite, vous serez deconnecte apres la modification.
                  </p>
                </div>

                {passwordMessage ? <div className={`alert alert-${passwordStatus} py-2`}>{passwordMessage}</div> : null}

                <form onSubmit={handlePasswordSubmit} className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Mot de passe actuel</label>
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
                    <label className="form-label">Nouveau mot de passe</label>
                    <input
                      type="password"
                      className={`form-control ${passwordErrors.password ? "is-invalid" : ""}`}
                      value={passwordForm.password}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, password: e.target.value }))}
                    />
                    {passwordErrors.password ? <div className="invalid-feedback">{passwordErrors.password[0]}</div> : null}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Confirmation</label>
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
                          Modification...
                        </>
                      ) : (
                        "Changer le mot de passe"
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
