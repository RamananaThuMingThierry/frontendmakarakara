import React, { useEffect, useMemo, useState } from "react";
import { settingsApi } from "../../../api/settings";
import { paymentMethodsApi } from "../../../api/payment_methods";
import { cityApi } from "../../../api/cities";
import TranslatedFileInput from "../../../Components/common/TranslatedFileInput";
import { useI18n } from "../../../hooks/website/I18nContext";
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

function DeleteModal({
  open,
  onClose,
  onConfirm,
  loading,
  title,
  confirmLabel,
  cancelLabel,
  deletingLabel,
  message,
  itemName,
  warning,
}) {
  if (!open) return null;

  return (
    <Modal
      open={open}
      title={title}
      onClose={() => (!loading ? onClose() : null)}
      footer={
        <>
          <button className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                {deletingLabel}
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2" />
                {confirmLabel}
              </>
            )}
          </button>
        </>
      }
    >
      <div className="alert alert-warning mb-0">
        {message} <b>{itemName}</b> ?
        <div className="text-muted small mt-1">{warning}</div>
      </div>
    </Modal>
  );
}

export default function SettingsPage() {
  const { t } = useI18n();
  const tabs = useMemo(
    () => [
      { key: "about", label: t("settings.tabs.about", "About"), icon: "bi-info-circle" },
      { key: "payments", label: t("settings.tabs.payments", "Payment methods"), icon: "bi-credit-card" },
      { key: "cities", label: t("settings.tabs.cities", "Cities"), icon: "bi-geo-alt" },
    ],
    [t]
  );

  const [tab, setTab] = useState("about");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const [about, setAbout] = useState({
    title: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    logo: "",
    logoFile: null,
    facebook: "",
    instagram: "",
    whatsapp: "",
  });
  const [aboutSaving, setAboutSaving] = useState(false);

  const [methods, setMethods] = useState([]);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [pmModalOpen, setPmModalOpen] = useState(false);
  const [pmSaving, setPmSaving] = useState(false);
  const [pmEditing, setPmEditing] = useState(null);
  const [pmForm, setPmForm] = useState({
    name: "",
    code: "",
    is_active: true,
    imageFile: null,
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
  const [cityDeleteOpen, setCityDeleteOpen] = useState(false);
  const [cityDeleteItem, setCityDeleteItem] = useState(null);
  const [cityDeleteLoading, setCityDeleteLoading] = useState(false);

  const aboutLogoPreview = useMemo(() => {
    if (about.logoFile) return URL.createObjectURL(about.logoFile);
    return about.logo ? imageUrl(about.logo) : "";
  }, [about.logo, about.logoFile]);

  useEffect(() => {
    return () => {
      if (aboutLogoPreview?.startsWith("blob:")) URL.revokeObjectURL(aboutLogoPreview);
    };
  }, [aboutLogoPreview]);

  async function loadAbout() {
    const res = await settingsApi.show();
    setAbout((prev) => ({ ...prev, ...(res?.value || {}), logoFile: null }));
  }

  async function saveAbout() {
    setAboutSaving(true);
    setAlert(null);
    try {
      const payload = {
        ...about,
        logo: about.logoFile || null,
      };
      delete payload.logoFile;

      const res = await settingsApi.update(payload);
      setAbout((prev) => ({ ...prev, ...(res?.data || {}), logoFile: null }));
      setAlert({
        type: "success",
        text: res?.message || t("settings.alert.aboutSaved", "About section updated successfully."),
      });
    } catch (e) {
      setAlert({
        type: "danger",
        text: e?.message || t("settings.alert.saveError", "Error while saving."),
      });
    } finally {
      setAboutSaving(false);
    }
  }

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
        text: e?.message || t("settings.alert.citiesLoadError", "Error while loading cities."),
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
        setAlert({ type: "success", text: res?.message || t("settings.alert.cityCreated", "City created.") });
      } else {
        const encryptedId = cityEditing?.encrypted_id;
        const res = await cityApi.update(encryptedId, payload);
        setAlert({ type: "success", text: res?.message || t("settings.alert.cityUpdated", "City updated.") });
      }

      setCityModalOpen(false);
      await loadCities();
    } catch (e) {
      setAlert({
        type: "danger",
        text: e?.message || t("settings.alert.citySaveError", "Error while saving the city."),
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
        text: e?.message || t("settings.alert.toggleError", "Error while changing the status."),
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
        text: res?.message || t("settings.alert.cityDeleted", "City deleted."),
      });

      closeDeleteCity();
    } catch (e) {
      setAlert({
        type: "danger",
        text: e?.message || t("settings.alert.deleteError", "Error while deleting."),
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
        text: e?.message || t("settings.alert.paymentsLoadError", "Error while loading payment methods."),
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
        setAlert({ type: "success", text: res?.message || t("settings.alert.paymentCreated", "Payment method created.") });
      } else {
        const encryptedId = pmEditing?.encrypted_id;
        const res = await paymentMethodsApi.update(encryptedId, payload);
        setAlert({ type: "success", text: res?.message || t("settings.alert.paymentUpdated", "Payment method updated.") });
      }

      setPmModalOpen(false);
      await loadPaymentMethods();
    } catch (e) {
      setAlert({
        type: "danger",
        text: e?.message || t("settings.alert.paymentSaveError", "Error while saving the payment method."),
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
      const res = await paymentMethodsApi.update(encryptedId, payload);

      setMethods((prev) =>
        prev.map((m) =>
          m?.encrypted_id === encryptedId ? { ...m, is_active: !m.is_active } : m
        )
      );

      if (res?.message) setAlert({ type: "success", text: res.message });
    } catch (e) {
      setAlert({
        type: "danger",
        text: e?.message || t("settings.alert.toggleError", "Error while changing the status."),
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
        text: res?.message || t("settings.alert.paymentDeleted", "Payment method deleted."),
      });

      closeDeletePM();
    } catch (e) {
      setAlert({
        type: "danger",
        text: e?.message || t("settings.alert.deleteError", "Error while deleting."),
      });
    } finally {
      setDeleteLoading(false);
    }
  }

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
          setAlert({ type: "danger", text: e?.message || t("settings.alert.loadError", "Loading error.") });
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
          <h4 className="mb-1">{t("settings.title", "Settings")}</h4>
          <div className="text-muted small">{t("settings.subtitle", "Manage the about section, payment methods and cities.")}</div>
        </div>
      </div>

      {alert ? (
        <div className={`alert alert-${alert.type} d-flex align-items-center justify-content-between`} role="alert">
          <span>{alert.text}</span>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setAlert(null)} type="button">
            {t("settings.actions.close", "Close")}
          </button>
        </div>
      ) : null}

      <ul className="nav nav-tabs mb-3">
        {tabs.map((item) => (
          <li className="nav-item" key={item.key}>
            <button
              type="button"
              className={`nav-link ${tab === item.key ? "active" : ""}`}
              onClick={() => setTab(item.key)}
            >
              <i className={`bi ${item.icon} me-2`} />
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      {loading ? (
        <div className="p-4 bg-white border rounded-3">
          <div className="d-flex align-items-center gap-2">
            <span className="spinner-border spinner-border-sm" />
            <span>{t("settings.loading", "Loading...")}</span>
          </div>
        </div>
      ) : null}

      {!loading && tab === "about" ? (
        <div className="row g-3">
          <div className="col-12 col-xl-8">
            <div className="bg-white border rounded-3 p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h5 className="mb-0">{t("settings.about.title", "About the platform")}</h5>
                <button className="btn btn-warning btn-sm" onClick={saveAbout} type="button" disabled={aboutSaving}>
                  {aboutSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      {t("settings.actions.saving", "Saving...")}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-save me-2" />
                      {t("settings.actions.save", "Save")}
                    </>
                  )}
                </button>
              </div>

              <Field label={t("settings.about.fields.title", "Title")}>
                <input
                  className="form-control"
                  value={about.title}
                  onChange={(e) => setAbout((p) => ({ ...p, title: e.target.value }))}
                  placeholder={t("settings.about.placeholders.title", "Ex: MAHAKARAKARA")}
                />
              </Field>

              <Field label={t("settings.about.fields.description", "Description")}>
                <textarea
                  className="form-control"
                  rows={6}
                  value={about.description}
                  onChange={(e) => setAbout((p) => ({ ...p, description: e.target.value }))}
                  placeholder={t("settings.about.placeholders.description", "Present your platform...")}
                />
              </Field>

              <Field
                label={t("settings.about.fields.logo", "Logo")}
                hint={t("settings.about.hints.logo", "Used in emails and PDF invoices sent to customers.")}
              >
                <TranslatedFileInput
                  accept="image/*"
                  selectedText={about.logoFile?.name || ""}
                  onChange={(e) => setAbout((p) => ({ ...p, logoFile: e.target.files?.[0] || null }))}
                />
              </Field>

              <div className="row">
                <div className="col-md-6">
                  <Field label={t("settings.about.fields.phone", "Phone")}>
                    <input
                      className="form-control"
                      value={about.phone}
                      onChange={(e) => setAbout((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+261 ..."
                    />
                  </Field>
                </div>
                <div className="col-md-6">
                  <Field label={t("settings.about.fields.email", "Email")}>
                    <input
                      className="form-control"
                      value={about.email}
                      onChange={(e) => setAbout((p) => ({ ...p, email: e.target.value }))}
                      placeholder="contact@..."
                    />
                  </Field>
                </div>
              </div>

              <Field label={t("settings.about.fields.address", "Address")}>
                <input
                  className="form-control"
                  value={about.address}
                  onChange={(e) => setAbout((p) => ({ ...p, address: e.target.value }))}
                  placeholder={t("settings.about.placeholders.address", "Address / City")}
                />
              </Field>

              <div className="row">
                <div className="col-md-4">
                  <Field label="Facebook">
                    <input
                      className="form-control"
                      value={about.facebook}
                      onChange={(e) => setAbout((p) => ({ ...p, facebook: e.target.value }))}
                      placeholder={t("settings.about.placeholders.facebook", "Facebook page link")}
                    />
                  </Field>
                </div>
                <div className="col-md-4">
                  <Field label="Instagram">
                    <input
                      className="form-control"
                      value={about.instagram}
                      onChange={(e) => setAbout((p) => ({ ...p, instagram: e.target.value }))}
                      placeholder={t("settings.about.placeholders.instagram", "Instagram link")}
                    />
                  </Field>
                </div>
                <div className="col-md-4">
                  <Field label="WhatsApp">
                    <input
                      className="form-control"
                      value={about.whatsapp}
                      onChange={(e) => setAbout((p) => ({ ...p, whatsapp: e.target.value }))}
                      placeholder={t("settings.about.placeholders.whatsapp", "Ex: +261...")}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-4">
            <div className="bg-white border rounded-3 p-3">
              <h6 className="mb-2">{t("settings.about.previewTitle", "Quick preview")}</h6>
              <div className="border rounded-3 p-3">
                {aboutLogoPreview ? (
                  <div className="mb-3">
                    <img
                      src={aboutLogoPreview}
                      alt={about.title || t("settings.about.logoAlt", "Platform logo")}
                      className="rounded border bg-light"
                      style={{ width: 96, height: 96, objectFit: "contain" }}
                    />
                  </div>
                ) : null}
                <div className="fw-bold">{about.title || "-"}</div>
                <div className="text-muted small mb-2">{about.description || "-"}</div>
                <div className="small">
                  <div>
                    <i className="bi bi-telephone me-2 text-success" />
                    {about.phone || "-"}
                  </div>
                  <div>
                    <i className="bi bi-envelope me-2 text-danger" />
                    {about.email || "-"}
                  </div>
                  <div>
                    <i className="bi bi-geo-alt me-2" />
                    {about.address || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && tab === "payments" ? (
        <div className="bg-white border rounded-3 p-3">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="mb-0">{t("settings.payments.title", "Payment methods")}</h5>
            <button className="btn btn-warning btn-sm" onClick={openCreatePM} type="button">
              <i className="bi bi-plus-lg me-2" />
              {t("settings.actions.add", "Add")}
            </button>
          </div>

          {methodsLoading ? (
            <div className="d-flex align-items-center gap-2">
              <span className="spinner-border spinner-border-sm" />
              <span>{t("settings.loading", "Loading...")}</span>
            </div>
          ) : methods.length === 0 ? (
            <div className="text-center text-muted py-4">{t("settings.payments.empty", "No payment methods.")}</div>
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
                            title={t("settings.payments.noImage", "No image")}
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
                              {t("settings.payments.code", "Code")} : <code>{m.code}</code>
                            </div>
                          </div>
                          <div>
                            {m.is_active ? (
                              <span className="badge text-bg-success">{t("settings.status.active", "Active")}</span>
                            ) : (
                              <span className="badge text-bg-secondary">{t("settings.status.inactive", "Inactive")}</span>
                            )}
                          </div>
                        </div>
                        <hr />
                        <div className="d-flex gap-2 mt-3">
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => togglePaymentMethod(m)}
                            type="button"
                            title={t("settings.actions.toggle", "Enable/Disable")}
                          >
                            <i className={`bi ${m.is_active ? "bi-toggle-on" : "bi-toggle-off"}`} />
                          </button>

                          <button className="btn btn-outline-dark btn-sm" onClick={() => openEditPM(m)} type="button">
                            <i className="bi bi-pencil-square me-1" />
                            {t("settings.actions.edit", "Edit")}
                          </button>

                          <button className="btn btn-outline-danger btn-sm ms-auto" onClick={() => openDeletePM(m)} type="button">
                            <i className="bi bi-trash me-1" />
                            {t("settings.actions.delete", "Delete")}
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

      {!loading && tab === "cities" ? (
        <div className="bg-white border rounded-3 p-3">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="mb-0">{t("settings.cities.title", "Cities")}</h5>
            <button className="btn btn-warning btn-sm" onClick={openCreateCity} type="button">
              <i className="bi bi-plus-lg me-2" />
              {t("settings.actions.add", "Add")}
            </button>
          </div>

          {citiesLoading ? (
            <div className="d-flex align-items-center gap-2">
              <span className="spinner-border spinner-border-sm" />
              <span>{t("settings.loading", "Loading...")}</span>
            </div>
          ) : cities.length === 0 ? (
            <div className="text-center text-muted py-4">{t("settings.cities.empty", "No cities.")}</div>
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
                            {t("settings.cities.region", "Region")} : <span>{c.region || "-"}</span>
                          </div>
                        </div>
                        <div>
                          {c.is_active ? (
                            <span className="badge text-bg-success">{t("settings.status.active", "Active")}</span>
                          ) : (
                            <span className="badge text-bg-secondary">{t("settings.status.inactive", "Inactive")}</span>
                          )}
                        </div>
                      </div>

                      <hr />

                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => toggleCity(c)}
                          type="button"
                          title={t("settings.actions.toggle", "Enable/Disable")}
                        >
                          <i className={`bi ${c.is_active ? "bi-toggle-on" : "bi-toggle-off"}`} />
                        </button>

                        <button className="btn btn-outline-dark btn-sm" onClick={() => openEditCity(c)} type="button">
                          <i className="bi bi-pencil-square me-1" />
                          {t("settings.actions.edit", "Edit")}
                        </button>

                        <button className="btn btn-outline-danger btn-sm ms-auto" onClick={() => openDeleteCity(c)} type="button">
                          <i className="bi bi-trash me-1" />
                          {t("settings.actions.delete", "Delete")}
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

      <Modal
        open={pmModalOpen}
        title={pmEditing ? t("settings.payments.modal.editTitle", "Edit payment method") : t("settings.payments.modal.createTitle", "Add payment method")}
        onClose={() => (!pmSaving ? setPmModalOpen(false) : null)}
        footer={
          <>
            <button className="btn btn-outline-secondary" onClick={() => setPmModalOpen(false)} disabled={pmSaving}>
              {t("settings.actions.cancel", "Cancel")}
            </button>
            <button className="btn btn-warning" onClick={submitPaymentMethod} disabled={pmSaving}>
              {pmSaving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  {t("settings.actions.saving", "Saving...")}
                </>
              ) : (
                <>
                  <i className="bi bi-save me-2" />
                  {t("settings.actions.save", "Save")}
                </>
              )}
            </button>
          </>
        }
      >
        <div className="row">
          <div className="col-md-6">
            <Field label={t("settings.payments.fields.name", "Name")}>
              <input
                className="form-control"
                value={pmForm.name}
                onChange={(e) => setPmForm((p) => ({ ...p, name: e.target.value }))}
                placeholder={t("settings.payments.placeholders.name", "Ex: Cash on delivery")}
              />
            </Field>
          </div>

          <div className="col-md-6">
            <Field label={t("settings.payments.fields.code", "Code")} hint={t("settings.payments.hints.code", "Ex: cod, mvola, orange_money...")}>
              <input
                className="form-control"
                value={pmForm.code}
                onChange={(e) => setPmForm((p) => ({ ...p, code: e.target.value }))}
                placeholder={t("settings.payments.placeholders.code", "Ex: cod")}
              />
            </Field>
          </div>
        </div>

        <Field label={t("settings.payments.fields.image", "Image / Logo")}>
          <TranslatedFileInput
            accept="image/*"
            selectedText={pmForm.imageFile?.name || ""}
            onChange={(e) => setPmForm((p) => ({ ...p, imageFile: e.target.files?.[0] || null }))}
          />
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
            {t("settings.status.active", "Active")}
          </label>
        </div>
      </Modal>

      <DeleteModal
        open={deleteOpen}
        itemName={deleteItem?.name || t("settings.payments.defaultDeleteName", "this payment method")}
        loading={deleteLoading}
        onClose={closeDeletePM}
        onConfirm={confirmDeletePaymentMethod}
        title={t("settings.delete.title", "Confirm deletion")}
        message={t("settings.delete.paymentMessage", "Are you sure you want to delete")}
        warning={t("settings.delete.warning", "This action is irreversible.")}
        cancelLabel={t("settings.actions.cancel", "Cancel")}
        confirmLabel={t("settings.actions.delete", "Delete")}
        deletingLabel={t("settings.delete.deleting", "Deleting...")}
      />

      <Modal
        open={cityModalOpen}
        title={cityEditing ? t("settings.cities.modal.editTitle", "Edit city") : t("settings.cities.modal.createTitle", "Add city")}
        onClose={() => (!citySaving ? setCityModalOpen(false) : null)}
        footer={
          <>
            <button className="btn btn-outline-secondary" onClick={() => setCityModalOpen(false)} disabled={citySaving}>
              {t("settings.actions.cancel", "Cancel")}
            </button>
            <button className="btn btn-warning" onClick={submitCity} disabled={citySaving}>
              {citySaving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  {t("settings.actions.saving", "Saving...")}
                </>
              ) : (
                <>
                  <i className="bi bi-save me-2" />
                  {t("settings.actions.save", "Save")}
                </>
              )}
            </button>
          </>
        }
      >
        <div className="row">
          <div className="col-md-6">
            <Field label={t("settings.cities.fields.name", "Name")}>
              <input
                className="form-control"
                value={cityForm.name}
                onChange={(e) => setCityForm((p) => ({ ...p, name: e.target.value }))}
                placeholder={t("settings.cities.placeholders.name", "Ex: Antananarivo")}
              />
            </Field>
          </div>

          <div className="col-md-6">
            <Field label={t("settings.cities.fields.region", "Region")}>
              <input
                className="form-control"
                value={cityForm.region}
                onChange={(e) => setCityForm((p) => ({ ...p, region: e.target.value }))}
                placeholder={t("settings.cities.placeholders.region", "Ex: Analamanga")}
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
            {t("settings.status.active", "Active")}
          </label>
        </div>
      </Modal>

      <DeleteModal
        open={cityDeleteOpen}
        itemName={cityDeleteItem?.name || t("settings.cities.defaultDeleteName", "this city")}
        loading={cityDeleteLoading}
        onClose={closeDeleteCity}
        onConfirm={confirmDeleteCity}
        title={t("settings.delete.title", "Confirm deletion")}
        message={t("settings.delete.cityMessage", "Are you sure you want to delete")}
        warning={t("settings.delete.warning", "This action is irreversible.")}
        cancelLabel={t("settings.actions.cancel", "Cancel")}
        confirmLabel={t("settings.actions.delete", "Delete")}
        deletingLabel={t("settings.delete.deleting", "Deleting...")}
      />
    </div>
  );
}
