import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  changeClientPassword,
  getClientAccount,
  resendClientVerificationEmail,
  updateClientAccount,
} from "../../api/client_account";
import {
  createClientAddress,
  deleteClientAddress,
  listClientAddresses,
  updateClientAddress,
} from "../../api/client_addresses";
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
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressForm, setAddressForm] = useState({
    id: "",
    label: "",
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city_name: "",
    region: "",
    latitude: "",
    longitude: "",
    is_default: true,
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [addressMessage, setAddressMessage] = useState("");
  const [addressStatus, setAddressStatus] = useState("success");
  const [addressLoading, setAddressLoading] = useState(false);

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
    let cancelled = false;

    async function loadAddresses() {
      setAddressesLoading(true);

      try {
        const data = await listClientAddresses();
        if (cancelled) return;
        setAddresses(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setAddresses([]);
      } finally {
        if (!cancelled) setAddressesLoading(false);
      }
    }

    loadAddresses();
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

  function resetAddressForm() {
    setAddressForm({
      id: "",
      label: "",
      full_name: account?.name || "",
      phone: account?.phone || "",
      address_line1: "",
      address_line2: "",
      city_name: "",
      region: "",
      latitude: "",
      longitude: "",
      is_default: addresses.length === 0,
    });
    setAddressErrors({});
  }

  useEffect(() => {
    if (!addresses.length && !addressForm.id) {
      setAddressForm((prev) => ({
        ...prev,
        full_name: prev.full_name || account?.name || "",
        phone: prev.phone || account?.phone || "",
        is_default: true,
      }));
    }
  }, [account?.name, account?.phone, addresses.length, addressForm.id]);

  async function reloadAddresses() {
    const data = await listClientAddresses();
    setAddresses(Array.isArray(data) ? data : []);
  }

  async function handleAddressSubmit(e) {
    e.preventDefault();
    setAddressLoading(true);
    setAddressErrors({});
    setAddressMessage("");
    setAddressStatus("success");

    const payload = {
      label: addressForm.label || null,
      full_name: addressForm.full_name,
      phone: addressForm.phone,
      address_line1: addressForm.address_line1,
      address_line2: addressForm.address_line2 || null,
      city_name: addressForm.city_name || null,
      region: addressForm.region || null,
      latitude: addressForm.latitude || null,
      longitude: addressForm.longitude || null,
      is_default: Boolean(addressForm.is_default),
    };

    try {
      const response = addressForm.id
        ? await updateClientAddress(addressForm.id, payload)
        : await createClientAddress(payload);

      await reloadAddresses();
      setAddressMessage(response?.message || "Adresse enregistree.");
      resetAddressForm();
    } catch (error) {
      setAddressStatus("danger");
      setAddressErrors(error?.response?.data?.errors || {});
      setAddressMessage(error?.response?.data?.message || "Impossible d'enregistrer l'adresse.");
    } finally {
      setAddressLoading(false);
    }
  }

  function handleAddressEdit(address) {
    setAddressErrors({});
    setAddressMessage("");
    setAddressForm({
      id: address.encrypted_id || address.id,
      label: address.label || "",
      full_name: address.full_name || "",
      phone: address.phone || "",
      address_line1: address.address_line1 || "",
      address_line2: address.address_line2 || "",
      city_name: address.city_name || "",
      region: address.region || "",
      latitude: address.latitude || "",
      longitude: address.longitude || "",
      is_default: Boolean(address.is_default),
    });
  }

  async function handleAddressDelete(address) {
    if (!window.confirm("Supprimer cette adresse ?")) return;

    try {
      await deleteClientAddress(address.encrypted_id || address.id);
      await reloadAddresses();
      if ((address.encrypted_id || address.id) === addressForm.id) {
        resetAddressForm();
      }
    } catch (error) {
      setAddressStatus("danger");
      setAddressMessage(error?.response?.data?.message || "Suppression impossible.");
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

      <div className="bg-white rounded-4 shadow-sm p-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
          <div>
            <h2 className="h5 fw-bold mb-1">Adresses de livraison</h2>
            <div className="text-secondary small">Enregistrez vos informations pour pre-remplir la commande.</div>
          </div>
          <button className="btn btn-outline-dark btn-sm" type="button" onClick={resetAddressForm}>
            Nouvelle adresse
          </button>
        </div>

        {addressMessage ? <div className={`alert alert-${addressStatus} py-2`}>{addressMessage}</div> : null}

        <div className="row g-4">
          <div className="col-12 col-xl-7">
            {addressesLoading ? (
              <div className="text-secondary">Chargement des adresses...</div>
            ) : addresses.length ? (
              <div className="d-flex flex-column gap-3">
                {addresses.map((address) => (
                  <div key={address.id} className="border rounded-4 p-3">
                    <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                      <div>
                        <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                          <span className="fw-semibold">{address.label || address.city_name || "Adresse"}</span>
                          {address.is_default ? <span className="badge text-bg-warning">Par defaut</span> : null}
                        </div>
                        <div>{address.full_name || "-"}</div>
                        <div className="text-secondary small">{address.phone || "-"}</div>
                        <div className="text-secondary small">{address.full_address || address.address_line1 || "-"}</div>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        <button className="btn btn-sm btn-outline-dark" type="button" onClick={() => handleAddressEdit(address)}>
                          Modifier
                        </button>
                        <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => handleAddressDelete(address)}>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-4 p-4 text-secondary">
                Aucune adresse enregistree pour le moment.
              </div>
            )}
          </div>

          <div className="col-12 col-xl-5">
            <form onSubmit={handleAddressSubmit} className="row g-3">
              <div className="col-12">
                <label className="form-label">Label</label>
                <input
                  className={`form-control ${addressErrors.label ? "is-invalid" : ""}`}
                  value={addressForm.label}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="Ex: Maison, Bureau"
                />
                {addressErrors.label ? <div className="invalid-feedback">{addressErrors.label[0]}</div> : null}
              </div>
              <div className="col-12">
                <label className="form-label">Nom complet</label>
                <input
                  className={`form-control ${addressErrors.full_name ? "is-invalid" : ""}`}
                  value={addressForm.full_name}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, full_name: e.target.value }))}
                />
                {addressErrors.full_name ? <div className="invalid-feedback">{addressErrors.full_name[0]}</div> : null}
              </div>
              <div className="col-12">
                <label className="form-label">Telephone</label>
                <input
                  className={`form-control ${addressErrors.phone ? "is-invalid" : ""}`}
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
                {addressErrors.phone ? <div className="invalid-feedback">{addressErrors.phone[0]}</div> : null}
              </div>
              <div className="col-12">
                <label className="form-label">Adresse</label>
                <input
                  className={`form-control ${addressErrors.address_line1 ? "is-invalid" : ""}`}
                  value={addressForm.address_line1}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, address_line1: e.target.value }))}
                />
                {addressErrors.address_line1 ? <div className="invalid-feedback">{addressErrors.address_line1[0]}</div> : null}
              </div>
              <div className="col-12">
                <label className="form-label">Complement</label>
                <input
                  className={`form-control ${addressErrors.address_line2 ? "is-invalid" : ""}`}
                  value={addressForm.address_line2}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, address_line2: e.target.value }))}
                />
                {addressErrors.address_line2 ? <div className="invalid-feedback">{addressErrors.address_line2[0]}</div> : null}
              </div>
              <div className="col-md-6">
                <label className="form-label">Ville</label>
                <input
                  className={`form-control ${addressErrors.city_name ? "is-invalid" : ""}`}
                  value={addressForm.city_name}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, city_name: e.target.value }))}
                />
                {addressErrors.city_name ? <div className="invalid-feedback">{addressErrors.city_name[0]}</div> : null}
              </div>
              <div className="col-md-6">
                <label className="form-label">Region</label>
                <input
                  className={`form-control ${addressErrors.region ? "is-invalid" : ""}`}
                  value={addressForm.region}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, region: e.target.value }))}
                />
                {addressErrors.region ? <div className="invalid-feedback">{addressErrors.region[0]}</div> : null}
              </div>
              <div className="col-md-6">
                <label className="form-label">Latitude</label>
                <input
                  className={`form-control ${addressErrors.latitude ? "is-invalid" : ""}`}
                  value={addressForm.latitude}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, latitude: e.target.value }))}
                />
                {addressErrors.latitude ? <div className="invalid-feedback">{addressErrors.latitude[0]}</div> : null}
              </div>
              <div className="col-md-6">
                <label className="form-label">Longitude</label>
                <input
                  className={`form-control ${addressErrors.longitude ? "is-invalid" : ""}`}
                  value={addressForm.longitude}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, longitude: e.target.value }))}
                />
                {addressErrors.longitude ? <div className="invalid-feedback">{addressErrors.longitude[0]}</div> : null}
              </div>
              <div className="col-12">
                <label className="d-flex align-items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(addressForm.is_default)}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, is_default: e.target.checked }))}
                  />
                  <span>Definir comme adresse par defaut</span>
                </label>
              </div>
              <div className="col-12 d-flex flex-wrap gap-2">
                <button className="btn btn-dark" type="submit" disabled={addressLoading}>
                  {addressLoading ? "Enregistrement..." : addressForm.id ? "Mettre a jour" : "Ajouter l'adresse"}
                </button>
                {addressForm.id ? (
                  <button className="btn btn-outline-secondary" type="button" onClick={resetAddressForm}>
                    Annuler
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
