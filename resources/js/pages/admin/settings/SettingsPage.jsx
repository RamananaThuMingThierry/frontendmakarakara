import React, { useEffect, useMemo, useState } from "react";
import { settingsApi } from "../../../api/settings";
import { paymentMethodsApi } from "../../../api/payment_methods"; // <-- adapte le chemin
import { cityApi } from "../../../api/cities";
import { imageUrl } from "../../../utils/Url";

function Field({ label, children, hint }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label}</label>
      {children}
      {hint ? <div className="form-text">{hint}</div> : null}
    </div>
  );
}

function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block" }}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            {footer ? <div className="modal-footer">{footer}</div> : null}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  );
}

function DeleteModal({ open, onClose, onConfirm, loading, item }) {
  if (!open) return null;

  return (
    <Modal
      open={open}
      title="Confirmer la suppression"
      onClose={() => (!loading ? onClose() : null)}
      footer={
        <>
          <button
            className="btn btn-outline-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Suppression...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2" />
                Supprimer
              </>
            )}
          </button>
        </>
      }
    >
      <div className="alert alert-warning mb-0">
        Tu es sûr(e) de vouloir supprimer{" "}
        <b>{item?.name || "ce moyen de paiement"}</b> ?
        <div className="text-muted small mt-1">
          Cette action est irréversible.
        </div>
      </div>
    </Modal>
  );
}

export default function SettingsPage() {
  const tabs = useMemo(
    () => [
      { key: "about", label: "À propos", icon: "bi-info-circle" },
      { key: "payments", label: "Moyens de paiement", icon: "bi-credit-card" },
      { key: "cities", label: "Villes", icon: "bi-geo-alt" },
    ],
    []
  );

  const [tab, setTab] = useState("about");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // -----------------------------
  // 1) ABOUT
  // -----------------------------
  const [about, setAbout] = useState({
    title: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    facebook: "",
    instagram: "",
    whatsapp: "",
  });

  const [aboutSaving, setAboutSaving] = useState(false);

  async function loadAbout() {
    const res = await settingsApi.show();
    setAbout((prev) => ({ ...prev, ...(res?.value || {}) }));
  }

  async function saveAbout() {
    setAboutSaving(true);
    setAlert(null);
    try {
      const res = await settingsApi.update(about);
      setAlert({
        type: "success",
        text: res?.message || "À propos mis à jour avec succès.",
      });
    } catch (e) {
      setAlert({
        type: "danger",
        text: e?.message || "Erreur lors de l'enregistrement.",
      });
    } finally {
      setAboutSaving(false);
    }
  }

  // -----------------------------
  // 2) PAYMENT METHODS
  // -----------------------------
  const [methods, setMethods] = useState([]);
  const [methodsLoading, setMethodsLoading] = useState(false);

  const [pmModalOpen, setPmModalOpen] = useState(false);
  const [pmSaving, setPmSaving] = useState(false);
  const [pmEditing, setPmEditing] = useState(null);

  const [pmForm, setPmForm] = useState({
    name: "",
    code: "",
    is_active: true,
    imageFile: null, // optionnel (voir notes)
  });

  // DELETE modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openCreatePM() {
    setPmEditing(null);
    setPmForm({ name: "", code: "", is_active: true, imageFile: null });
    setPmModalOpen(true);
  }

  function openEditPM(item) {
    setPmEditing(item);
    setPmForm({
      name: item?.name || "",
      code: item?.code || "",
      is_active: !!item?.is_active,
      imageFile: null,
    });
    setPmModalOpen(true);
  }

  function openDeletePM(item) {
    setDeleteItem(item);
    setDeleteOpen(true);
  }

  function closeDeletePM() {
    if (deleteLoading) return;
    setDeleteOpen(false);
    setDeleteItem(null);
  }

  // -----------------------------
// 3) CITIES
// -----------------------------
const [cities, setCities] = useState([]);
const [citiesLoading, setCitiesLoading] = useState(false);

const [cityModalOpen, setCityModalOpen] = useState(false);
const [citySaving, setCitySaving] = useState(false);
const [cityEditing, setCityEditing] = useState(null);

const [cityForm, setCityForm] = useState({
  name: "",
  region: "",
  is_active: true,
});

// delete
const [cityDeleteOpen, setCityDeleteOpen] = useState(false);
const [cityDeleteItem, setCityDeleteItem] = useState(null);
const [cityDeleteLoading, setCityDeleteLoading] = useState(false);

function openCreateCity() {
  setCityEditing(null);
  setCityForm({ name: "", region: "", is_active: true });
  setCityModalOpen(true);
}

function openEditCity(item) {
  setCityEditing(item);
  setCityForm({
    name: item?.name || "",
    region: item?.region || "",
    is_active: !!item?.is_active,
  });
  setCityModalOpen(true);
}

function openDeleteCity(item) {
  setCityDeleteItem(item);
  setCityDeleteOpen(true);
}

function closeDeleteCity() {
  if (cityDeleteLoading) return;
  setCityDeleteOpen(false);
  setCityDeleteItem(null);
}

async function loadCities() {
  setCitiesLoading(true);
  setAlert(null);
  try {
    const list = await cityApi.index();
    setCities(Array.isArray(list) ? list : []);
  } catch (e) {
    setAlert({
      type: "danger",
      text: e?.message || "Erreur lors du chargement des villes.",
    });
    setCities([]);
  } finally {
    setCitiesLoading(false);
  }
}

async function submitCity() {
  setCitySaving(true);
  setAlert(null);

  try {
    const payload = {
      name: cityForm.name,
      region: cityForm.region,
      is_active: cityForm.is_active ? 1 : 0,
    };

    if (!cityEditing) {
      const res = await cityApi.create(payload);
      setAlert({ type: "success", text: res?.message || "Ville créée." });
    } else {
      const encryptedId = cityEditing?.encrypted_id;
      const res = await cityApi.update(encryptedId, payload);
      setAlert({ type: "success", text: res?.message || "Ville modifiée." });
    }

    setCityModalOpen(false);
    await loadCities();
  } catch (e) {
    setAlert({
      type: "danger",
      text: e?.message || "Erreur lors de l'enregistrement de la ville.",
    });
  } finally {
    setCitySaving(false);
  }
}

async function toggleCity(item) {
  setAlert(null);
  try {
    const encryptedId = item?.encrypted_id;
    const payload = { is_active: item.is_active ? 0 : 1 };

    const res = await cityApi.update(encryptedId, payload);

    setCities((prev) =>
      prev.map((c) =>
        c?.encrypted_id === encryptedId ? { ...c, is_active: !c.is_active } : c
      )
    );

    if (res?.message) setAlert({ type: "success", text: res.message });
  } catch (e) {
    setAlert({
      type: "danger",
      text: e?.message || "Erreur lors de l'activation/désactivation.",
    });
  }
}

async function confirmDeleteCity() {
  if (!cityDeleteItem) return;

  setCityDeleteLoading(true);
  setAlert(null);

  try {
    const encryptedId = cityDeleteItem?.encrypted_id;
    const res = await cityApi.remove(encryptedId);

    setCities((prev) => prev.filter((c) => c?.encrypted_id !== encryptedId));

    setAlert({
      type: "success",
      text: res?.message || "Ville supprimée.",
    });

    closeDeleteCity();
  } catch (e) {
    setAlert({
      type: "danger",
      text: e?.message || "Erreur lors de la suppression.",
    });
  } finally {
    setCityDeleteLoading(false);
  }
}

  async function loadPaymentMethods() {
    setMethodsLoading(true);
    setAlert(null);
    try {
      const list = await paymentMethodsApi.index();
      setMethods(Array.isArray(list) ? list : []);
    } catch (e) {
      setAlert({
        type: "danger",
        text: e?.message || "Erreur lors du chargement des moyens de paiement.",
      });
      setMethods([]);
    } finally {
      setMethodsLoading(false);
    }
  }

  async function submitPaymentMethod() {
    setPmSaving(true);
    setAlert(null);

    try {
      const payload = {
        name: pmForm.name,
        code: pmForm.code,
        is_active: pmForm.is_active ? 1 : 0,
        image: pmForm.imageFile || null,
      };

      if (!pmEditing) {
        
        const res = await paymentMethodsApi.create(payload);
        setAlert({ type: "success", text: res?.message || "Moyen de paiement créé." });
      } else {

        const encryptedId = pmEditing?.encrypted_id;
        const res = await paymentMethodsApi.update(encryptedId, payload);
        setAlert({ type: "success", text: res?.message || "Moyen de paiement modifié." });
      }

      setPmModalOpen(false);
      await loadPaymentMethods();
    } catch (e) {
      setAlert({
        type: "danger",
        text: e?.message || "Erreur lors de l'enregistrement du moyen de paiement.",
      });
    } finally {
      setPmSaving(false);
    }
  }

  async function togglePaymentMethod(item) {
    setAlert(null);
    try {
      const encryptedId = item?.encrypted_id;
      const payload = { is_active: item.is_active ? 0 : 1 };

      console.log(encryptedId, payload);
      const res = await paymentMethodsApi.update(encryptedId, payload);

      setMethods((prev) =>
        prev.map((m) =>
          m?.encrypted_id === encryptedId
            ? { ...m, is_active: !m.is_active }
            : m
        )
      );

      if (res?.message) setAlert({ type: "success", text: res.message });
    } catch (e) {
      setAlert({
        type: "danger",
        text: e?.message || "Erreur lors de l'activation/désactivation.",
      });
    }
  }

async function confirmDeletePaymentMethod() {
    if (!deleteItem) return;

    setDeleteLoading(true);
    setAlert(null);

    try {
      const encryptedId = deleteItem?.encrypted_id;
      const res = await paymentMethodsApi.remove(encryptedId);

      setMethods((prev) => prev.filter((m) => m?.encrypted_id !== encryptedId));

      setAlert({
        type: "success",
        text: res?.message || "Moyen de paiement supprimé.",
      });

      closeDeletePM();
    } catch (e) {
      setAlert({
        type: "danger",
        text: e?.message || "Erreur lors de la suppression.",
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  // -----------------------------
  // INIT LOAD
  // -----------------------------
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setAlert(null);
      try {
        await loadAbout();
        await loadPaymentMethods();
        await loadCities();
      } catch (e) {
        if (mounted) {
          setAlert({ type: "danger", text: e?.message || "Erreur de chargement." });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-1">Settings</h4>
          <div className="text-muted small">
            Gérer l&apos;à propos et les moyens de paiement
          </div>
        </div>
      </div>

      {alert ? (
        <div
          className={`alert alert-${alert.type} d-flex align-items-center justify-content-between`}
          role="alert"
        >
          <span>{alert.text}</span>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setAlert(null)}
            type="button"
          >
            Fermer
          </button>
        </div>
      ) : null}

    <ul className="nav nav-tabs mb-3">
      {tabs.map((t) => (
        <li className="nav-item" key={t.key}>
          <button
            type="button"
            className={`nav-link ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <i className={`bi ${t.icon} me-2`} />
            {t.label}
          </button>
        </li>
      ))}
    </ul>

      {loading ? (
        <div className="p-4 bg-white border rounded-3">
          <div className="d-flex align-items-center gap-2">
            <span className="spinner-border spinner-border-sm" />
            <span>Chargement...</span>
          </div>
        </div>
      ) : null}

      {/* ABOUT TAB */}
      {!loading && tab === "about" ? (
        <div className="row g-3">
          <div className="col-12 col-xl-8">
            <div className="bg-white border rounded-3 p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h5 className="mb-0">À propos de la plateforme</h5>
                <button
                  className="btn btn-warning btn-sm"
                  onClick={saveAbout}
                  type="button"
                  disabled={aboutSaving}
                >
                  {aboutSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-save me-2" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>

              <Field label="Titre">
                <input
                  className="form-control"
                  value={about.title}
                  onChange={(e) =>
                    setAbout((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="Ex: MAHAKARAKARA"
                />
              </Field>

              <Field label="Description">
                <textarea
                  className="form-control"
                  rows={6}
                  value={about.description}
                  onChange={(e) =>
                    setAbout((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Présente ta plateforme..."
                />
              </Field>

              <div className="row">
                <div className="col-md-6">
                  <Field label="Téléphone">
                    <input
                      className="form-control"
                      value={about.phone}
                      onChange={(e) =>
                        setAbout((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="+261 ..."
                    />
                  </Field>
                </div>
                <div className="col-md-6">
                  <Field label="Email">
                    <input
                      className="form-control"
                      value={about.email}
                      onChange={(e) =>
                        setAbout((p) => ({ ...p, email: e.target.value }))
                      }
                      placeholder="contact@..."
                    />
                  </Field>
                </div>
              </div>

              <Field label="Adresse">
                <input
                  className="form-control"
                  value={about.address}
                  onChange={(e) =>
                    setAbout((p) => ({ ...p, address: e.target.value }))
                  }
                  placeholder="Adresse / Ville"
                />
              </Field>

              <div className="row">
                <div className="col-md-4">
                  <Field label="Facebook">
                    <input
                      className="form-control"
                      value={about.facebook}
                      onChange={(e) =>
                        setAbout((p) => ({ ...p, facebook: e.target.value }))
                      }
                      placeholder="Lien page Facebook"
                    />
                  </Field>
                </div>
                <div className="col-md-4">
                  <Field label="Instagram">
                    <input
                      className="form-control"
                      value={about.instagram}
                      onChange={(e) =>
                        setAbout((p) => ({ ...p, instagram: e.target.value }))
                      }
                      placeholder="Lien Instagram"
                    />
                  </Field>
                </div>
                <div className="col-md-4">
                  <Field label="WhatsApp">
                    <input
                      className="form-control"
                      value={about.whatsapp}
                      onChange={(e) =>
                        setAbout((p) => ({ ...p, whatsapp: e.target.value }))
                      }
                      placeholder="Ex: +261..."
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-4">
            <div className="bg-white border rounded-3 p-3">
              <h6 className="mb-2">Aperçu rapide</h6>
              <div className="border rounded-3 p-3">
                <div className="fw-bold">{about.title || "—"}</div>
                <div className="text-muted small mb-2">
                  {about.description || "—"}
                </div>
                <div className="small">
                  <div>
                    <i className="bi bi-telephone me-2 text-success" />
                    {about.phone || "—"}
                  </div>
                  <div>
                    <i className="bi bi-envelope me-2 text-danger" />
                    {about.email || "—"}
                  </div>
                  <div>
                    <i className="bi bi-geo-alt me-2" />
                    {about.address || "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* PAYMENT METHODS TAB */}
{!loading && tab === "payments" ? (
        <div className="bg-white border rounded-3 p-3">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="mb-0">Moyens de paiement</h5>
            <button
              className="btn btn-warning btn-sm"
              onClick={openCreatePM}
              type="button"
            >
              <i className="bi bi-plus-lg me-2" />
              Ajouter
            </button>
          </div>

          {methodsLoading ? (
            <div className="d-flex align-items-center gap-2">
              <span className="spinner-border spinner-border-sm" />
              <span>Chargement...</span>
            </div>
          ) : methods.length === 0 ? (
            <div className="text-center text-muted py-4">
              Aucun moyen de paiement.
            </div>
          ) : (
            <div className="row g-3">
              {methods.map((m) => (
                <div className="col-12 col-md-6 col-xl-4" key={m?.encrypted_id}>
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body d-flex gap-3">
                      <div>
                        {m.image ? (
                          <img
                            src={imageUrl(m.image)}
                            alt={m.name}
                            className="rounded border"
                            style={{ width: 56, height: 56, objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            className="bg-light border rounded d-flex align-items-center justify-content-center"
                            style={{ width: 56, height: 56 }}
                            title="Aucune image"
                          >
                            <i className="bi bi-image text-muted" />
                          </div>
                        )}
                      </div>

                      <div className="flex-grow-1">
                        <div className="d-flex align-items-start justify-content-between">
                          <div>
                            <div className="fw-semibold">{m.name}</div>
                            <div className="text-muted small">
                              Code: <code>{m.code}</code>
                            </div>
                          </div>
                          <div>
                            {m.is_active ? (
                              <span className="badge text-bg-success">
                                Actif
                              </span>
                            ) : (
                              <span className="badge text-bg-secondary">
                                Inactif
                              </span>
                            )}
                          </div>
                        </div>
<hr />
                        <div className="d-flex gap-2 mt-3">
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => togglePaymentMethod(m)}
                            type="button"
                            title="Activer/Désactiver"
                          >
                            <i
                              className={`bi ${
                                m.is_active ? "bi-toggle-on" : "bi-toggle-off"
                              }`}
                            />
                          </button>

                          <button
                            className="btn btn-outline-dark btn-sm"
                            onClick={() => openEditPM(m)}
                            type="button"
                          >
                            <i className="bi bi-pencil-square me-1" />
                            Modifier
                          </button>

                          <button
                            className="btn btn-outline-danger btn-sm ms-auto"
                            onClick={() => openDeletePM(m)}
                            type="button"
                          >
                            <i className="bi bi-trash me-1" />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

{/* CITIES TAB */}
{!loading && tab === "cities" ? (
  <div className="bg-white border rounded-3 p-3">
    <div className="d-flex align-items-center justify-content-between mb-3">
      <h5 className="mb-0">Villes</h5>
      <button className="btn btn-warning btn-sm" onClick={openCreateCity} type="button">
        <i className="bi bi-plus-lg me-2" />
        Ajouter
      </button>
    </div>

    {citiesLoading ? (
      <div className="d-flex align-items-center gap-2">
        <span className="spinner-border spinner-border-sm" />
        <span>Chargement...</span>
      </div>
    ) : cities.length === 0 ? (
      <div className="text-center text-muted py-4">Aucune ville.</div>
    ) : (
      <div className="row g-3">
        {cities.map((c) => (
          <div className="col-12 col-md-6 col-xl-4" key={c?.encrypted_id}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-start justify-content-between">
                  <div>
                    <div className="fw-semibold">{c.name}</div>
                    <div className="text-muted small">
                      Région: <span>{c.region || "—"}</span>
                    </div>
                  </div>
                  <div>
                    {c.is_active ? (
                      <span className="badge text-bg-success">Actif</span>
                    ) : (
                      <span className="badge text-bg-secondary">Inactif</span>
                    )}
                  </div>
                </div>

                <hr />

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => toggleCity(c)}
                    type="button"
                    title="Activer/Désactiver"
                  >
                    <i className={`bi ${c.is_active ? "bi-toggle-on" : "bi-toggle-off"}`} />
                  </button>

                  <button
                    className="btn btn-outline-dark btn-sm"
                    onClick={() => openEditCity(c)}
                    type="button"
                  >
                    <i className="bi bi-pencil-square me-1" />
                    Modifier
                  </button>

                  <button
                    className="btn btn-outline-danger btn-sm ms-auto"
                    onClick={() => openDeleteCity(c)}
                    type="button"
                  >
                    <i className="bi bi-trash me-1" />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
) : null}


      {/* MODAL CREATE/EDIT */}
      <Modal
        open={pmModalOpen}
        title={pmEditing ? "Modifier moyen de paiement" : "Ajouter moyen de paiement"}
        onClose={() => (!pmSaving ? setPmModalOpen(false) : null)}
        footer={
          <>
            <button
              className="btn btn-outline-secondary"
              onClick={() => setPmModalOpen(false)}
              disabled={pmSaving}
            >
              Annuler
            </button>
            <button
              className="btn btn-warning"
              onClick={submitPaymentMethod}
              disabled={pmSaving}
            >
              {pmSaving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <i className="bi bi-save me-2" />
                  Enregistrer
                </>
              )}
            </button>
          </>
        }
      >
        <div className="row">
          <div className="col-md-6">
            <Field label="Nom">
              <input
                className="form-control"
                value={pmForm.name}
                onChange={(e) =>
                  setPmForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Ex: Paiement à la livraison"
              />
            </Field>
          </div>

          <div className="col-md-6">
            <Field label="Code" hint="Ex: cod, mvola, orange_money...">
              <input
                className="form-control"
                value={pmForm.code}
                onChange={(e) =>
                  setPmForm((p) => ({ ...p, code: e.target.value }))
                }
                placeholder="Ex: cod"
              />
            </Field>
          </div>
        </div>

        <Field label="Image / Logo">
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={(e) =>
              setPmForm((p) => ({
                ...p,
                imageFile: e.target.files?.[0] || null,
              }))
            }
          />
        </Field>

        <div className="form-check">
          <input
            id="pm_active"
            type="checkbox"
            className="form-check-input"
            checked={pmForm.is_active}
            onChange={(e) =>
              setPmForm((p) => ({ ...p, is_active: e.target.checked }))
            }
          />
          <label className="form-check-label" htmlFor="pm_active">
            Actif
          </label>
        </div>
      </Modal>

      {/* MODAL DELETE */}
      <DeleteModal
        open={deleteOpen}
        item={deleteItem}
        loading={deleteLoading}
        onClose={closeDeletePM}
        onConfirm={confirmDeletePaymentMethod}
      />

            {/* MODAL CITY CREATE/EDIT */}
      <Modal
        open={cityModalOpen}
        title={cityEditing ? "Modifier ville" : "Ajouter ville"}
        onClose={() => (!citySaving ? setCityModalOpen(false) : null)}
        footer={
          <>
            <button
              className="btn btn-outline-secondary"
              onClick={() => setCityModalOpen(false)}
              disabled={citySaving}
            >
              Annuler
            </button>
            <button className="btn btn-warning" onClick={submitCity} disabled={citySaving}>
              {citySaving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <i className="bi bi-save me-2" />
                  Enregistrer
                </>
              )}
            </button>
          </>
        }
      >
        <div className="row">
          <div className="col-md-6">
            <Field label="Nom">
              <input
                className="form-control"
                value={cityForm.name}
                onChange={(e) => setCityForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Antananarivo"
              />
            </Field>
          </div>

          <div className="col-md-6">
            <Field label="Région">
              <input
                className="form-control"
                value={cityForm.region}
                onChange={(e) => setCityForm((p) => ({ ...p, region: e.target.value }))}
                placeholder="Ex: Analamanga"
              />
            </Field>
          </div>
        </div>

        <div className="form-check">
          <input
            id="city_active"
            type="checkbox"
            className="form-check-input"
            checked={cityForm.is_active}
            onChange={(e) => setCityForm((p) => ({ ...p, is_active: e.target.checked }))}
          />
          <label className="form-check-label" htmlFor="city_active">
            Actif
          </label>
        </div>
      </Modal>

      {/* MODAL CITY DELETE */}
      <DeleteModal
        open={cityDeleteOpen}
        item={cityDeleteItem}
        loading={cityDeleteLoading}
        onClose={closeDeleteCity}
        onConfirm={confirmDeleteCity}
      />
    </div>
  );
}