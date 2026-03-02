import React, { useEffect, useMemo, useState } from "react";

/**
 * ⚠️ Adapte BASE_URL + headers auth (token, cookies...) selon ton projet
 */
const BASE_URL = "/api/admin";

async function apiFetch(url, { method = "GET", body, isFormData = false } = {}) {
  const opts = { method, headers: {} };

  if (!isFormData) {
    opts.headers["Content-Type"] = "application/json";
  }

  // Si tu utilises token:
  // const token = localStorage.getItem("token");
  // if (token) opts.headers["Authorization"] = `Bearer ${token}`;

  if (body) {
    opts.body = isFormData ? body : JSON.stringify(body);
  }

  const res = await fetch(url, opts);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.message || `Erreur API (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

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
      <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
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

export default function SettingsPage() {
  // Tabs
  const tabs = useMemo(() => ([
    { key: "about", label: "À propos" },
    { key: "payments", label: "Moyens de paiement" },
  ]), []);
  const [tab, setTab] = useState("about");

  // Global states
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success'|'danger', text }

  // -----------------------------
  // 1) ABOUT (Setting key)
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
    const data = await apiFetch(`${BASE_URL}/settings/about-platform`);
    // data.value = { ... }
    setAbout((prev) => ({ ...prev, ...(data?.value || {}) }));
  }

  async function saveAbout() {
    setAboutSaving(true);
    setAlert(null);
    try {
      await apiFetch(`${BASE_URL}/settings/about-platform`, {
        method: "PUT",
        body: { value: about },
      });
      setAlert({ type: "success", text: "À propos mis à jour avec succès." });
    } catch (e) {
      setAlert({ type: "danger", text: e.message || "Erreur lors de l'enregistrement." });
    } finally {
      setAboutSaving(false);
    }
  }

  // -----------------------------
  // 2) PAYMENT METHODS (CRUD)
  // -----------------------------
  const [methods, setMethods] = useState([]);
  const [methodsLoading, setMethodsLoading] = useState(false);

  const [pmModalOpen, setPmModalOpen] = useState(false);
  const [pmSaving, setPmSaving] = useState(false);
  const [pmEditing, setPmEditing] = useState(null); // existing item or null
  const [pmForm, setPmForm] = useState({
    name: "",
    code: "",
    is_active: true,
    imageFile: null,
  });

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

  async function loadPaymentMethods() {
    setMethodsLoading(true);
    try {
      const data = await apiFetch(`${BASE_URL}/payment-methods`);
      // attend: [{ encrypted_id, name, code, image, is_active }]
      setMethods(Array.isArray(data) ? data : (data?.data || []));
    } finally {
      setMethodsLoading(false);
    }
  }

  async function submitPaymentMethod() {
    setPmSaving(true);
    setAlert(null);
    try {
      const fd = new FormData();
      fd.append("name", pmForm.name);
      fd.append("code", pmForm.code);
      fd.append("is_active", pmForm.is_active ? "1" : "0");
      if (pmForm.imageFile) fd.append("image", pmForm.imageFile);

      if (!pmEditing) {
        await apiFetch(`${BASE_URL}/payment-methods`, { method: "POST", body: fd, isFormData: true });
        setAlert({ type: "success", text: "Moyen de paiement créé." });
      } else {
        // si tu utilises PUT/PATCH, adapte ici
        await apiFetch(`${BASE_URL}/payment-methods/${pmEditing.encrypted_id}`, {
          method: "POST",
          body: fd,
          isFormData: true,
        });
        setAlert({ type: "success", text: "Moyen de paiement modifié." });
      }

      setPmModalOpen(false);
      await loadPaymentMethods();
    } catch (e) {
      setAlert({ type: "danger", text: e.message || "Erreur lors de l'enregistrement du moyen de paiement." });
    } finally {
      setPmSaving(false);
    }
  }

  async function togglePaymentMethod(item) {
    setAlert(null);
    try {
      await apiFetch(`${BASE_URL}/payment-methods/${item.encrypted_id}/toggle`, {
        method: "PATCH",
        body: { is_active: !item.is_active },
      });
      setMethods((prev) =>
        prev.map((m) => (m.encrypted_id === item.encrypted_id ? { ...m, is_active: !m.is_active } : m))
      );
    } catch (e) {
      setAlert({ type: "danger", text: e.message || "Erreur lors de l'activation/désactivation." });
    }
  }

  async function deletePaymentMethod(item) {
    const ok = window.confirm(`Supprimer "${item.name}" ?`);
    if (!ok) return;

    setAlert(null);
    try {
      await apiFetch(`${BASE_URL}/payment-methods/${item.encrypted_id}`, { method: "DELETE" });
      setMethods((prev) => prev.filter((m) => m.encrypted_id !== item.encrypted_id));
      setAlert({ type: "success", text: "Moyen de paiement supprimé." });
    } catch (e) {
      setAlert({ type: "danger", text: e.message || "Erreur lors de la suppression." });
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
      } catch (e) {
        if (mounted) setAlert({ type: "danger", text: e.message || "Erreur de chargement." });
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
          <div className="text-muted small">Gérer l&apos;à propos et les moyens de paiement</div>
        </div>
      </div>

      {alert ? (
        <div className={`alert alert-${alert.type} d-flex align-items-center justify-content-between`} role="alert">
          <span>{alert.text}</span>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setAlert(null)} type="button">
            Fermer
          </button>
        </div>
      ) : null}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        {tabs.map((t) => (
          <li className="nav-item" key={t.key}>
            <button
              type="button"
              className={`nav-link ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
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
                  onChange={(e) => setAbout((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Ex: MAHAKARAKARA"
                />
              </Field>

              <Field label="Description">
                <textarea
                  className="form-control"
                  rows={6}
                  value={about.description}
                  onChange={(e) => setAbout((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Présente ta plateforme..."
                />
              </Field>

              <div className="row">
                <div className="col-md-6">
                  <Field label="Téléphone">
                    <input
                      className="form-control"
                      value={about.phone}
                      onChange={(e) => setAbout((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+261 ..."
                    />
                  </Field>
                </div>
                <div className="col-md-6">
                  <Field label="Email">
                    <input
                      className="form-control"
                      value={about.email}
                      onChange={(e) => setAbout((p) => ({ ...p, email: e.target.value }))}
                      placeholder="contact@..."
                    />
                  </Field>
                </div>
              </div>

              <Field label="Adresse">
                <input
                  className="form-control"
                  value={about.address}
                  onChange={(e) => setAbout((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Adresse / Ville"
                />
              </Field>

              <div className="row">
                <div className="col-md-4">
                  <Field label="Facebook">
                    <input
                      className="form-control"
                      value={about.facebook}
                      onChange={(e) => setAbout((p) => ({ ...p, facebook: e.target.value }))}
                      placeholder="Lien page Facebook"
                    />
                  </Field>
                </div>
                <div className="col-md-4">
                  <Field label="Instagram">
                    <input
                      className="form-control"
                      value={about.instagram}
                      onChange={(e) => setAbout((p) => ({ ...p, instagram: e.target.value }))}
                      placeholder="Lien Instagram"
                    />
                  </Field>
                </div>
                <div className="col-md-4">
                  <Field label="WhatsApp">
                    <input
                      className="form-control"
                      value={about.whatsapp}
                      onChange={(e) => setAbout((p) => ({ ...p, whatsapp: e.target.value }))}
                      placeholder="Ex: +261..."
                    />
                  </Field>
                </div>
              </div>

              <div className="text-muted small">
                Stocké dans <code>settings</code> (clé <code>about_platform</code>) avec <code>value</code> en JSON.
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-4">
            <div className="bg-white border rounded-3 p-3">
              <h6 className="mb-2">Aperçu rapide</h6>
              <div className="border rounded-3 p-3">
                <div className="fw-bold">{about.title || "—"}</div>
                <div className="text-muted small mb-2">{about.description || "—"}</div>
                <div className="small">
                  <div><i className="bi bi-telephone me-2" />{about.phone || "—"}</div>
                  <div><i className="bi bi-envelope me-2" />{about.email || "—"}</div>
                  <div><i className="bi bi-geo-alt me-2" />{about.address || "—"}</div>
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
            <div>
              <h5 className="mb-0">Moyens de paiement</h5>
              <div className="text-muted small">Activer/désactiver, ajouter, modifier, supprimer</div>
            </div>
            <button className="btn btn-warning btn-sm" onClick={openCreatePM} type="button">
              <i className="bi bi-plus-lg me-2" />
              Ajouter
            </button>
          </div>

          {methodsLoading ? (
            <div className="d-flex align-items-center gap-2">
              <span className="spinner-border spinner-border-sm" />
              <span>Chargement...</span>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th style={{ width: 72 }}>Logo</th>
                    <th>Nom</th>
                    <th>Code</th>
                    <th>Statut</th>
                    <th className="text-end" style={{ width: 220 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {methods.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        Aucun moyen de paiement.
                      </td>
                    </tr>
                  ) : (
                    methods.map((m) => (
                      <tr key={m.encrypted_id}>
                        <td>
                          {m.image ? (
                            <img
                              src={m.image}
                              alt={m.name}
                              style={{ width: 44, height: 44, objectFit: "cover" }}
                              className="rounded"
                            />
                          ) : (
                            <div
                              className="bg-light border rounded d-flex align-items-center justify-content-center"
                              style={{ width: 44, height: 44 }}
                              title="Aucune image"
                            >
                              <i className="bi bi-image text-muted" />
                            </div>
                          )}
                        </td>
                        <td className="fw-semibold">{m.name}</td>
                        <td><code>{m.code}</code></td>
                        <td>
                          {m.is_active ? (
                            <span className="badge text-bg-success">Actif</span>
                          ) : (
                            <span className="badge text-bg-secondary">Inactif</span>
                          )}
                        </td>
                        <td className="text-end">
                          <div className="btn-group">
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              type="button"
                              onClick={() => togglePaymentMethod(m)}
                              title="Activer/Désactiver"
                            >
                              <i className={`bi ${m.is_active ? "bi-toggle-on" : "bi-toggle-off"}`} />
                            </button>
                            <button
                              className="btn btn-outline-dark btn-sm"
                              type="button"
                              onClick={() => openEditPM(m)}
                            >
                              <i className="bi bi-pencil-square me-1" />
                              Modifier
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              type="button"
                              onClick={() => deletePaymentMethod(m)}
                            >
                              <i className="bi bi-trash me-1" />
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-muted small mt-2">
            Données stockées dans la table <code>payment_methods</code> (modèle <code>PaymentMethod</code>).
          </div>
        </div>
      ) : null}

      {/* PAYMENT METHOD MODAL */}
      <Modal
        open={pmModalOpen}
        title={pmEditing ? "Modifier moyen de paiement" : "Ajouter moyen de paiement"}
        onClose={() => (!pmSaving ? setPmModalOpen(false) : null)}
        footer={
          <>
            <button className="btn btn-outline-secondary" onClick={() => setPmModalOpen(false)} disabled={pmSaving}>
              Annuler
            </button>
            <button className="btn btn-warning" onClick={submitPaymentMethod} disabled={pmSaving}>
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
                onChange={(e) => setPmForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Paiement à la livraison"
              />
            </Field>
          </div>
          <div className="col-md-6">
            <Field label="Code" hint="Ex: cod, mvola, orange_money...">
              <input
                className="form-control"
                value={pmForm.code}
                onChange={(e) => setPmForm((p) => ({ ...p, code: e.target.value }))}
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
            onChange={(e) => setPmForm((p) => ({ ...p, imageFile: e.target.files?.[0] || null }))}
          />
          {pmEditing?.image ? (
            <div className="form-text">
              Image actuelle: <span className="fw-semibold">{pmEditing.image}</span>
            </div>
          ) : null}
        </Field>

        <div className="form-check">
          <input
            id="pm_active"
            type="checkbox"
            className="form-check-input"
            checked={pmForm.is_active}
            onChange={(e) => setPmForm((p) => ({ ...p, is_active: e.target.checked }))}
          />
          <label className="form-check-label" htmlFor="pm_active">
            Actif
          </label>
        </div>
      </Modal>
    </div>
  );
}
