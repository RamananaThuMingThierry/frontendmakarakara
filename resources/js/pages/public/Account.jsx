import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/website/AuthContext";
import { changePassword, updateAccount } from "../../api/account";
import "../../../css/website.css";

export default function Account() {
  const { user, logout, replaceAuthUser } = useAuth();
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

  useEffect(() => {
    setProfileForm((prev) => ({
      ...prev,
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      avatar: null,
    }));
  }, [user]);

  const avatarPreview = useMemo(() => {
    if (profileForm.avatar instanceof File) {
      return URL.createObjectURL(profileForm.avatar);
    }

    if (user?.avatar) {
      const apiUrl = import.meta.env.VITE_API_URL || "http://192.168.0.17:8000/api";
      const base = apiUrl.replace(/\/api\/?$/, "");
      return `${base}/${user.avatar}`;
    }

    return null;
  }, [profileForm.avatar, user?.avatar]);

  useEffect(() => {
    return () => {
      if (avatarPreview && profileForm.avatar instanceof File) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview, profileForm.avatar]);

  const submitProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileErrors({});
    setProfileMessage("");
    setProfileStatus("success");

    try {
      const data = await updateAccount(profileForm);
      replaceAuthUser(data.user || null);
      setProfileForm((prev) => ({ ...prev, avatar: null }));
      setProfileMessage(data.message || "Informations mises a jour.");
    } catch (error) {
      setProfileStatus("danger");
      setProfileErrors(error?.response?.data?.errors || {});
      setProfileMessage(error?.response?.data?.message || "Mise a jour impossible.");
    } finally {
      setProfileLoading(false);
    }
  };

  const submitPassword = async (e) => {
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
      setPasswordMessage(data.message || "Mot de passe modifie.");
    } catch (error) {
      setPasswordStatus("danger");
      setPasswordErrors(error?.response?.data?.errors || {});
      setPasswordMessage(error?.response?.data?.message || "Modification impossible.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <main className="account-page py-5">
      <div className="container">
        <div className="d-flex flex-column flex-md-row align-items-start justify-content-between gap-3 mb-4">
          <div>
            <h1 className="fw-bold mb-1">Mon compte</h1>
            <p className="text-secondary mb-0">
              Bonjour <span className="fw-semibold">{user?.name}</span>
            </p>
          </div>
          <button className="btn btn-outline-danger" onClick={logout} type="button">
            <i className="bi bi-box-arrow-right me-2" />
            Déconnexion
          </button>
        </div>

        <div className="row g-4 align-items-start">
          <div className="col-12 col-lg-4">
            <div className="account-card h-100 p-4">
              <div className="text-center">
                <div className="account-avatar mx-auto mb-3">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={user?.name || "Avatar"} />
                  ) : (
                    <span>{(user?.name || "U").charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <h5 className="fw-bold mb-1">{user?.name}</h5>
                <p className="text-secondary mb-3">{user?.email}</p>
              </div>

              <div className="small text-secondary d-flex flex-column gap-2">
                <div>
                  <span className="fw-semibold text-dark">Telephone :</span>{" "}
                  {user?.phone || "Non renseigne"}
                </div>
                <div>
                  <span className="fw-semibold text-dark">Role :</span>{" "}
                  Client
                </div>
              </div>

              <div className="alert alert-light border mt-4 mb-0">
                Modifiez vos informations personnelles ou votre mot de passe depuis cette page.
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-8">
            <div className="account-card p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <div>
                  <h5 className="fw-bold mb-1">Informations personnelles</h5>
                  <p className="text-secondary mb-0">
                    Gardez votre profil a jour pour vos futures commandes.
                  </p>
                </div>
              </div>

              {profileMessage ? (
                <div className={`alert alert-${profileStatus} py-2`}>
                  {profileMessage}
                </div>
              ) : null}

              <form onSubmit={submitProfile} className="row g-3">
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
                    {profileLoading ? "Enregistrement..." : "Enregistrer les modifications"}
                  </button>
                </div>
              </form>
            </div>

            <div className="account-card p-4">
              <h5 className="fw-bold mb-1">Modifier le mot de passe</h5>
              <p className="text-secondary mb-3">
                Utilisez votre mot de passe actuel pour en definir un nouveau.
              </p>

              {passwordMessage ? (
                <div className={`alert alert-${passwordStatus} py-2`}>
                  {passwordMessage}
                </div>
              ) : null}

              <form onSubmit={submitPassword} className="row g-3">
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
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, password_confirmation: e.target.value }))}
                  />
                </div>

                <div className="col-12">
                  <button className="btn btn-outline-dark px-4" type="submit" disabled={passwordLoading}>
                    {passwordLoading ? "Modification..." : "Changer le mot de passe"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
