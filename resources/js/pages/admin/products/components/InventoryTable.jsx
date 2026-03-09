import { useEffect, useMemo, useState } from "react";
import { cityApi } from "@/api/cities";
import { inventoryApi } from "@/api/inventories";

export default function InventoryTable({ product, reload }) {
  const inventories = useMemo(() => {
    return product?.inventories || product?.data || [];
  }, [product]);

  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showCreateEditModal, setShowCreateEditModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [editingRow, setEditingRow] = useState(null);
  const [adjustingRow, setAdjustingRow] = useState(null);
  const [transferRow, setTransferRow] = useState(null);

  const [apiErrorMessage, setApiErrorMessage] = useState("");
  const [formErrors, setFormErrors] = useState({});

  function resetErrors() {
    setApiErrorMessage("");
    setFormErrors({});
  }

  function extractRequestErrors(error) {
    const data = error?.response?.data || error || {};
    return {
      message: data.message || "Une erreur est survenue.",
      errors: data.errors || {},
    };
  }

  function getFieldError(field) {
    return formErrors?.[field]?.[0] || "";
  }

  const [form, setForm] = useState({
    product_id: "",
    city_id: "",
    price: "",
    compare_price: "",
    quantity: 0,
    min_stock: 0,
    is_available: true,
    reason: "",
    note: "",
  });

  const [adjustForm, setAdjustForm] = useState({
    product_id: "",
    city_id: "",
    type: "up",
    quantity: "",
    reason: "",
    note: "",
  });

  const [transferForm, setTransferForm] = useState({
    product_id: "",
    city_from_id: "",
    city_to_id: "",
    quantity: "",
    reason: "",
    note: "",
  });

  useEffect(() => {
    fetchCities();
  }, []);

  async function fetchCities() {
    try {
      setLoadingCities(true);
      const response = await cityApi.index();
      setCities(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Erreur chargement villes :", error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  }

  function resetForm() {
    setForm({
      product_id: product?.id || "",
      city_id: "",
      price: product?.price || "",
      compare_price: product?.compare_price || "",
      quantity: 0,
      min_stock: 0,
      is_available: true,
      reason: "",
      note: "",
    });
  }

  function resetAdjustForm(row = null) {
    setAdjustForm({
      product_id: row?.product_id || product?.id || "",
      city_id: row?.city_id || "",
      type: "up",
      quantity: "",
      reason: "",
      note: "",
    });
  }

  function resetTransferForm(row = null) {
    setTransferForm({
      product_id: row?.product_id || product?.id || "",
      city_from_id: row?.city_id || "",
      city_to_id: "",
      quantity: "",
      reason: "",
      note: "",
    });
  }

  function openCreateModal() {
    setEditingRow(null);
    resetForm();
    resetErrors();
    setShowCreateEditModal(true);
  }

  function openEditModal(row) {
    setEditingRow(row);
    resetErrors();
    setForm({
      product_id: row.product_id || product?.id || "",
      city_id: row.city_id || "",
      price: row.price || "",
      compare_price: row.compare_price || "",
      quantity: row.quantity || 0,
      reserved_quantity: row.reserved_quantity || 0,
      min_stock: row.min_stock || 0,
      is_available: !!row.is_available,
      status: row.status || "ok",
      reason: "",
      note: "",
    });
    setShowCreateEditModal(true);
  }

  function openAdjustModal(row) {
    setAdjustingRow(row);
    resetAdjustForm(row);
    resetErrors();
    setShowAdjustModal(true);
  }

  function openTransferModal(row) {
    setTransferRow(row);
    resetTransferForm(row);
      resetErrors();
    setShowTransferModal(true);
  }

  function closeCreateEditModal() {
    setShowCreateEditModal(false);
    setEditingRow(null);
    resetForm();
    resetErrors();
  }

  function closeAdjustModal() {
    setShowAdjustModal(false);
    setAdjustingRow(null);
    resetAdjustForm();
    resetErrors();
  }

  function closeTransferModal() {
    setShowTransferModal(false);
    setTransferRow(null);
    resetTransferForm();
    resetErrors();
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleAdjustChange(e) {
    const { name, value } = e.target;
    setAdjustForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleTransferChange(e) {
    const { name, value } = e.target;
    setTransferForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    resetErrors();

    const payload = {
      product_id: Number(form.product_id || product?.id),
      city_id: Number(form.city_id),
      price: Number(form.price),
      compare_price: Number(form.compare_price || 0),
      quantity: Number(form.quantity),
      min_stock: Number(form.min_stock || 0),
      is_available: form.is_available,
      reason: form.reason || "initial_stock",
      note: form.note || null,
    };

    try {
      setSubmitting(true);

      if (editingRow) {
        const updatePayload = {
          product_id: Number(form.product_id || product?.id),
          city_id: Number(form.city_id),
          price: Number(form.price),
          compare_price: Number(form.compare_price || 0),
          quantity: Number(form.quantity),
          min_stock: Number(form.min_stock || 0),
          is_available: form.is_available,
          reason: form.reason || null,
          note: form.note || null,
        };

        await inventoryApi.update(
          editingRow.encrypted_id || editingRow.id,
          updatePayload
        );
      } else {
        await inventoryApi.create(payload);
      }

      closeCreateEditModal();
      reload?.();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);
      const { message, errors } = extractRequestErrors(error);
      setApiErrorMessage(message);
      setFormErrors(errors);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitAdjust(e) {
    e.preventDefault();
  resetErrors();
    if (!adjustingRow) return;

    try {
      setSubmitting(true);

      await inventoryApi.adjust(adjustingRow.encrypted_id || adjustingRow.id, {
        product_id: Number(adjustForm.product_id || adjustingRow.product_id || product?.id),
        city_id: Number(adjustForm.city_id || adjustingRow.city_id),
        quantity: Number(adjustForm.quantity),
        type: adjustForm.type,
        reason: adjustForm.reason,
        note: adjustForm.note || null,
      });

      closeAdjustModal();
      reload?.();
    } catch (error) {
  console.error("Erreur lors de l'ajustement :", error);
    const { message, errors } = extractRequestErrors(error);
    setApiErrorMessage(message);
    setFormErrors(errors);
    } finally {
      setSubmitting(false);
    }
  }

async function handleSubmitTransfer(e) {
  e.preventDefault();
  resetErrors();

  if (!transferRow) return;

  try {
    setSubmitting(true);

    await inventoryApi.transfert(transferRow.encrypted_id || transferRow.id, {
      product_id: Number(
        transferForm.product_id || transferRow.product_id || product?.id
      ),
      city_from_id: Number(transferForm.city_from_id || transferRow.city_id),
      city_to_id: Number(transferForm.city_to_id),
      quantity: Number(transferForm.quantity),
      reason: transferForm.reason,
      note: transferForm.note || null,
    });

    closeTransferModal();
    reload?.();
  } catch (error) {
    const { message, errors } = extractRequestErrors(error);
    setApiErrorMessage(message);
    setFormErrors(errors);
  } finally {
    setSubmitting(false);
  }
}

  function formatDate(date) {
    if (!date) return "-";
    return new Date(date).toLocaleString("fr-FR");
  }

  function formatPrice(value) {
    return `${Number(value || 0).toLocaleString("fr-FR")} Ar`;
  }

  function badgeStatus(status) {
    const map = {
      ok: "success",
      low_stock: "warning",
      out_of_stock: "danger",
      inactive: "secondary",
    };
    return map[status] || "secondary";
  }

  function statusLabel(status) {
    const map = {
      ok: "Normal",
      low_stock: "Faible",
      out_of_stock: "Rupture",
      inactive: "Inactif",
    };
    return map[status] || status;
  }

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Inventaire</h6>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openCreateModal}
          >
            + Ajouter un inventaire
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>Ville</th>
                <th>Prix</th>
                <th>Prix barré</th>
                <th>Qté</th>
                <th>Réservé</th>
                <th>Stock min</th>
                <th>Disponible</th>
                <th>Statut</th>
                <th>Création</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              {inventories.length > 0 ? (
                inventories.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.city?.name || "-"}</td>
                    <td className="text-primary fw-bold">{formatPrice(inv.price)}</td>
                    <td>{formatPrice(inv.compare_price)}</td>
                    <td>{inv.quantity}</td>
                    <td>{inv.reserved_quantity}</td>
                    <td>{inv.min_stock}</td>
                    <td>
                      <span
                        className={`rounded-pill p-1 badge ${
                          inv.is_available ? "bg-success" : "bg-danger"
                        }`}
                      >
                        {inv.is_available ? (
                          <i className="bi bi-check"></i>
                        ) : (
                          <i className="bi bi-x-circle"></i>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className={`badge bg-${badgeStatus(inv.status)}`}>
                        {statusLabel(inv.status)}
                      </span>
                    </td>
                    <td>{formatDate(inv.created_at)}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => openEditModal(inv)}
                      >
                        <i className="bi bi-pencil me-1"></i> Modifier
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success me-2"
                        onClick={() => openAdjustModal(inv)}
                      >
                        <i className="bi bi-sliders me-1"></i> Ajuster
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-dark me-2"
                        onClick={() => openTransferModal(inv)}
                      >
                        <i className="bi bi-arrow-left-right me-1"></i> Transfert
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center text-muted py-3">
                    Aucun inventaire trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateEditModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingRow ? "Modifier l'inventaire" : "Ajouter un inventaire"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeCreateEditModal}
                  />
                </div>

                <div className="modal-body">
                  {apiErrorMessage && (
                    <div className="alert alert-danger" role="alert">
                      {apiErrorMessage}
                    </div>
                  )}
                  <div className="row">
                    <div className="mb-3 col-md-12">
                      <label className="form-label">Ville</label>
<select
  name="city_id"
  className={`form-select ${getFieldError("city_id") ? "is-invalid" : ""}`}
  value={form.city_id}
  onChange={handleChange}
  required
  disabled={!!editingRow || loadingCities}
>
                        <option value="">-- Sélectionner une ville --</option>
                        {cities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                      {editingRow && (
                        <small className="text-muted">
                          La ville ne peut pas être modifiée.
                        </small>
                      )}
                      {getFieldError("city_id") && (
  <div className="invalid-feedback d-block">
    {getFieldError("city_id")}
  </div>
)}
                    </div>
                  </div>

                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label className="form-label">Prix</label>
                      <input
  type="number"
  name="price"
  className={`form-control ${getFieldError("price") ? "is-invalid" : ""}`}
  value={form.price}
  onChange={handleChange}
  min="0"
  required
/>
{getFieldError("price") && (
  <div className="invalid-feedback d-block">
    {getFieldError("price")}
  </div>
)}
                    </div>

                    <div className="mb-3 col-md-6">
                      <label className="form-label">Prix barré</label>
                      <input
                        type="number"
                        name="compare_price"
                        className="form-control"
                        value={form.compare_price}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label className="form-label">Quantité</label>
                      <input
  type="number"
  name="quantity"
  className={`form-control ${getFieldError("quantity") ? "is-invalid" : ""}`}
  value={form.quantity}
  onChange={handleChange}
  min="0"
  required
/>
{getFieldError("quantity") && (
  <div className="invalid-feedback d-block">
    {getFieldError("quantity")}
  </div>
)}
                    </div>

                    <div className="mb-3 col-md-6">
                      <label className="form-label">Stock minimum</label>
                      <input
                        type="number"
                        name="min_stock"
                        className="form-control"
                        value={form.min_stock}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                  </div>

                  {!editingRow && (
                    <>
                      <div className="row">
                        <div className="mb-3 col-12">
                          <label className="form-label">Raison</label>
                          <input
  type="text"
  name="reason"
  className={`form-control ${getFieldError("reason") ? "is-invalid" : ""}`}
  value={form.reason}
  onChange={handleChange}
  placeholder="Ex: stock initial"
/>
{getFieldError("reason") && (
  <div className="invalid-feedback d-block">
    {getFieldError("reason")}
  </div>
)}
                        </div>
                      </div>

                      <div className="row">
                        <div className="mb-3 col-12">
                          <label className="form-label">Note</label>
                          <textarea
                            name="note"
                            className="form-control"
                            value={form.note}
                            onChange={handleChange}
                            placeholder="Note optionnelle"
                            rows={3}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="row">
                    <div className="mb-3 col-md-6 d-flex align-items-end">
                      <div className="form-check">
                        <input
                          id="is_available"
                          type="checkbox"
                          name="is_available"
                          className="form-check-input"
                          checked={form.is_available}
                          onChange={handleChange}
                        />
                        <label htmlFor="is_available" className="form-check-label">
                          Disponible
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={closeCreateEditModal}
                    disabled={submitting}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting
                      ? "Enregistrement..."
                      : editingRow
                      ? "Mettre à jour"
                      : "Enregistrer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAdjustModal && adjustingRow && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmitAdjust}>
                <div className="modal-header">
                  <h5 className="modal-title">Ajuster le stock</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeAdjustModal}
                  />
                </div>

                <div className="modal-body">
                                    {apiErrorMessage && (
                    <div className="alert alert-danger" role="alert">
                      {apiErrorMessage}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Ville</label>
                    <input
                      type="text"
                      className="form-control"
                      value={adjustingRow.city?.name || ""}
                      disabled
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Type</label>
                    <select
                      name="type"
                      className="form-select"
                      value={adjustForm.type}
                      onChange={handleAdjustChange}
                      required
                    >
                      <option value="up">Augmenter (+)</option>
                      <option value="down">Diminuer (-)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Quantité</label>
                    <input
                      type="number"
                      name="quantity"
                      className="form-control"
                      value={adjustForm.quantity}
                      onChange={handleAdjustChange}
                      min="1"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Raison</label>
                    <select
                      name="reason"
                      className="form-select"
                      value={adjustForm.reason}
                      onChange={handleAdjustChange}
                      required
                    >
                      <option value="">-- Sélectionner une raison --</option>
                      <option value="Inventaire physique">Inventaire physique</option>
                      <option value="Casse / perte">Casse / perte</option>
                      <option value="Erreur de saisie">Erreur de saisie</option>
                      <option value="Autres">Autres</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Note</label>
                    <textarea
                      name="note"
                      className="form-control"
                      rows={3}
                      value={adjustForm.note}
                      onChange={handleAdjustChange}
                      placeholder="Note optionnelle"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={closeAdjustModal}
                    disabled={submitting}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-success" disabled={submitting}>
                    {submitting ? "Validation..." : "Valider l'ajustement"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showTransferModal && transferRow && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmitTransfer}>
                <div className="modal-header">
                  <h5 className="modal-title">Transférer le stock</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeTransferModal}
                  />
                </div>

                <div className="modal-body">
                                    {apiErrorMessage && (
                    <div className="alert alert-danger" role="alert">
                      {apiErrorMessage}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Ville source</label>
                    <input
                      type="text"
                      className="form-control"
                      value={transferRow.city?.name || ""}
                      disabled
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Ville de destination</label>
                    <select
                      name="city_to_id"
                      className="form-select"
                      value={transferForm.city_to_id}
                      onChange={handleTransferChange}
                      required
                    >
                      <option value="">-- Sélectionner une ville --</option>
                      {cities
                        .filter((city) => city.id !== transferRow.city_id)
                        .map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Quantité</label>
                    <input
                      type="number"
                      name="quantity"
  className={`form-control ${getFieldError("quantity") ? "is-invalid" : ""}`}
                      value={transferForm.quantity}
                      onChange={handleTransferChange}
                      min="1"
                      required
                    />
                    {getFieldError("quantity") && (
  <div className="invalid-feedback d-block">
    {getFieldError("quantity")}
  </div>
)}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Raison</label>
                    <input
                      type="text"
                      name="reason"
                      className="form-control"
                      value={transferForm.reason}
                      onChange={handleTransferChange}
                      placeholder="Ex: Rééquilibrage stock"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Note</label>
                    <textarea
                      name="note"
                      className="form-control"
                      rows={3}
                      value={transferForm.note}
                      onChange={handleTransferChange}
                      placeholder="Note optionnelle"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={closeTransferModal}
                    disabled={submitting}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-dark" disabled={submitting}>
                    {submitting ? "Validation..." : "Valider le transfert"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}