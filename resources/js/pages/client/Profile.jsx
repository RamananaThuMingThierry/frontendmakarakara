import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  changeClientPassword,
  getClientAccount,
  resendClientVerificationEmail,
  updateClientAccount,
} from "../../api/client_account";
import { useAuth } from "../../hooks/website/AuthContext";

function buildAvatarUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const apiUrl = import.meta.env.VITE_API_URL || "http://192.168.0.17:8000/api";
  const base = apiUrl.replace(/\/api\/?$/, "");
  return `${base}/${String(path).replace(/^\/+/, "")}`;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, replaceAuthUser, logout } = useAuth();
  const [account, setAccount] = useState(user || null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "", avatar: null });
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
        const data = await getClientAccount();
        if (cancelled) return;

        const nextUser = data?.user || null;
        setAccount(nextUser);
        replaceAuthUser(nextUser);
      } catch (error) {
        if (!cancelled) setLoadError(error?.response?.data?.message || "Impossible de charger votre compte.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAccount();
    return () => {
      cancelled = true;
    };
  }, [replaceAuthUser]);

  useEffect(() => {
    setProfileForm({
      name: account?.name || "",
      email: account?.email || "",
      phone: account?.phone || "",
      avatar: null,
    });
  }, [account]);

  const avatarPreview = useMemo(() => {
    if (profileForm.avatar instanceof File) return URL.createObjectURL(profileForm.avatar);
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
      const data = await updateClientAccount(profileForm);
      const nextUser = data?.user || null;
      setAccount(nextUser);
      replaceAuthUser(nextUser);
      setProfileForm((prev) => ({ ...prev, avatar: null }));
      setProfileMessage(data?.message || "Informations mises à jour.");
    } catch (error) {
      setProfileStatus("danger");
      setProfileErrors(error?.response?.data?.errors || {});
      setProfileMessage(error?.response?.data?.message || "Mise à jour impossible.");
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
      const data = await changeClientPassword(passwordForm);
      setPasswordForm({ current_password: "", password: "", password_confirmation: "" });
      setPasswordMessage(data?.message || "Mot de passe modifié.");
      await logout();
      navigate("/login", {
        replace: true,
        state: { message: data?.message || "Mot de passe modifié. Veuillez vous reconnecter." },
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
      const data = await resendClientVerificationEmail();
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

  if (loading) {
    return (
      <div className="bg-white rounded-4 shadow-sm p-5 text-center">
        <div className="spinner-border spinner-border-sm me-2" />
        Chargement du profil...
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      {loadError ? <div className="alert alert-danger">{loadError}</div> : null}

      <div className="bg-white rounded-4 shadow-sm p-4">
        <div className="d-flex flex-column flex-md-row gap-4 align-items-start">
          <div className="text-center">
            <div
              className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center overflow-hidden"
              style={{ width: 96, height: 96, fontSize: 32 }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt={account?.name || "Avatar"} className="w-100 h-100 object-fit-cover" />
              ) : (
                (account?.name || "C").charAt(0).toUpperCase()
              )}
            </div>
          </div>

          <div className="flex-grow-1">
            <h1 className="h4 fw-bold mb-1">Mon profil</h1>
            <p className="text-secondary mb-3">Mettez à jour vos informations personnelles.</p>
            <div className="d-flex flex-wrap gap-3 small">
              <span><strong>Téléphone:</strong> {account?.phone || "Non renseigné"}</span>
              <span>
                <strong>Email:</strong>{" "}
                <span className={account?.email_verified_at ? "text-success" : "text-warning"}>
                  {account?.email_verified_at ? "Vérifié" : "Non vérifié"}
                </span>
              </span>
            </div>

            {!account?.email_verified_at ? (
              <div className="alert alert-warning mt-3 mb-0">
                <div className="fw-semibold mb-2">Validation de l'email recommandée</div>
                {verificationMessage ? <div className={`alert alert-${verificationStatus} py-2`}>{verificationMessage}</div> : null}
                <button className="btn btn-sm btn-dark" type="button" onClick={handleResendVerification} disabled={verificationLoading}>
                  {verificationLoading ? "Envoi..." : "Renvoyer l'email"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow-sm p-4">
        <h2 className="h5 fw-bold mb-3">Informations personnelles</h2>
        {profileMessage ? <div className={`alert alert-${profileStatus} py-2`}>{profileMessage}</div> : null}
        <form onSubmit={handleProfileSubmit} className="row g-3">
          <div className="col-12">
            <label className="form-label">Photo de profil</label>
            <input
              type="file"
              className={`form-control ${profileErrors.avatar ? "is-invalid" : ""}`}
              accept=".jpg,.jpeg,.png"
              onChange={(e) => setProfileForm((prev) => ({ ...prev, avatar: e.target.files?.[0] || null }))}
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
            <label className="form-label">Email</label>
            <input
              type="email"
              className={`form-control ${profileErrors.email ? "is-invalid" : ""}`}
              value={profileForm.email}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            {profileErrors.email ? <div className="invalid-feedback">{profileErrors.email[0]}</div> : null}
          </div>
          <div className="col-12">
            <label className="form-label">Téléphone</label>
            <input
              className={`form-control ${profileErrors.phone ? "is-invalid" : ""}`}
              value={profileForm.phone}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
            {profileErrors.phone ? <div className="invalid-feedback">{profileErrors.phone[0]}</div> : null}
          </div>
          <div className="col-12">
            <button className="btn btn-dark" type="submit" disabled={profileLoading}>
              {profileLoading ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-4 shadow-sm p-4">
        <h2 className="h5 fw-bold mb-3">Mot de passe</h2>
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
            {passwordErrors.current_password ? <div className="invalid-feedback">{passwordErrors.current_password[0]}</div> : null}
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
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, password_confirmation: e.target.value }))}
            />
          </div>
          <div className="col-12">
            <button className="btn btn-outline-dark" type="submit" disabled={passwordLoading}>
              {passwordLoading ? "Modification..." : "Changer le mot de passe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
