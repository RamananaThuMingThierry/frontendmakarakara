import { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";
import { cityApi } from "@/api/cities";
import { inventoryApi } from "@/api/inventories";
import { useI18n } from "../../../../hooks/website/I18nContext";

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("fr-FR");
  } catch {
    return value;
  }
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
  return map[status] || status || "-";
}

export default function InventoryTable({ product, reload }) {
  const { lang } = useI18n();
  const DT_LANG_URL = useMemo(() => `/lang/datatables/${lang}.json`, [lang]);
  const inventories = useMemo(() => product?.inventories || product?.data || [], [product]);

  const tableRef = useRef(null);
  const dtRef = useRef(null);
  const inventoriesRef = useRef(inventories);
  const initializedRef = useRef(false);

  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const [showCreateEditModal, setShowCreateEditModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingRow, setEditingRow] = useState(null);
  const [adjustingRow, setAdjustingRow] = useState(null);
  const [transferRow, setTransferRow] = useState(null);
  const [viewRow, setViewRow] = useState(null);

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
    inventoriesRef.current = inventories;
  }, [inventories]);

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    const tableNode = tableRef.current;
    if (!tableNode) return;

    const $table = $(tableNode);

    try {
      $table.off("click", ".js-view");
      $table.off("click", ".js-edit");
      $table.off("click", ".js-adjust");
      $table.off("click", ".js-transfer");
    } catch {}

    try {
      if ($.fn.dataTable.isDataTable(tableNode)) {
        dtRef.current = $table.DataTable();
      } else {
        dtRef.current = $table.DataTable({
          data: [],
          destroy: true,
          retrieve: true,
          pageLength: 10,
          lengthMenu: [10, 15, 25, 50, 100],
          ordering: true,
          searching: true,
          responsive: true,
          language: { url: DT_LANG_URL },
          columns: [
            { data: "city.name", title: "Ville", defaultContent: "-" },
            { data: "price", title: "Prix", render: (value) => {
                return `<span class="text-primary fw-bold">${formatPrice(value)}</span>`;
            } },
            { data: "compare_price", title: "Prix barre", render: (value) => formatPrice(value) },
            { data: "quantity", title: "Qte", defaultContent: 0 },
            { data: "reserved_quantity", title: "Reserve", defaultContent: 0 },
            { data: "min_stock", title: "Stock min", defaultContent: 0 },
            {
              data: "is_available",
              title: "Disponible",
              render: (value) =>
                value
                  ? '<span class="rounded-pill p-1 badge bg-success"><i class="bi bi-check"></i></span>'
                  : '<span class="rounded-pill p-1 badge bg-danger"><i class="bi bi-x-circle"></i></span>',
            },
            {
              data: "status",
              title: "Statut",
              render: (value) =>
                `<span class="badge bg-${badgeStatus(value)}">${statusLabel(value)}</span>`,
            },
            {
              data: "created_at",
              title: "Creation",
              render: (value) => formatDate(value),
            },
            {
              data: null,
              title: "Actions",
              orderable: false,
              searchable: false,
              className: "text-end",
              render: (d, t, row) => `
                <button class="btn btn-sm btn-outline-info me-2 js-view" data-id="${row.id}">
                  <i class="bi bi-eye me-1"></i> Voir
                </button>
                <button class="btn btn-sm btn-outline-primary me-2 js-edit" data-id="${row.id}">
                  <i class="bi bi-pencil me-1"></i> Modifier
                </button>
                <button class="btn btn-sm btn-outline-success me-2 js-adjust" data-id="${row.id}">
                  <i class="bi bi-sliders me-1"></i> Ajuster
                </button>
                <button class="btn btn-sm btn-outline-dark js-transfer" data-id="${row.id}">
                  <i class="bi bi-arrow-left-right me-1"></i> Transfert
                </button>
              `,
            },
          ],
        });
      }

      initializedRef.current = true;
    } catch (error) {
      console.error("Erreur initialisation DataTable:", error);
    }

    $table.on("click", ".js-view", (e) => {
      const id = Number($(e.currentTarget).data("id"));
      const row = inventoriesRef.current.find((item) => Number(item.id) === id);
      if (row) openViewModal(row);
    });

    $table.on("click", ".js-edit", (e) => {
      const id = Number($(e.currentTarget).data("id"));
      const row = inventoriesRef.current.find((item) => Number(item.id) === id);
      if (row) openEditModal(row);
    });

    $table.on("click", ".js-adjust", (e) => {
      const id = Number($(e.currentTarget).data("id"));
      const row = inventoriesRef.current.find((item) => Number(item.id) === id);
      if (row) openAdjustModal(row);
    });

    $table.on("click", ".js-transfer", (e) => {
      const id = Number($(e.currentTarget).data("id"));
      const row = inventoriesRef.current.find((item) => Number(item.id) === id);
      if (row) openTransferModal(row);
    });

    return () => {
      try {
        $table.off("click", ".js-view");
        $table.off("click", ".js-edit");
        $table.off("click", ".js-adjust");
        $table.off("click", ".js-transfer");
      } catch {}

      try {
        if (dtRef.current && $.fn.dataTable.isDataTable(tableNode)) {
          dtRef.current.destroy();
        }
      } catch {}

      dtRef.current = null;
      initializedRef.current = false;

      if (tableNode.tBodies?.[0]) {
        tableNode.tBodies[0].innerHTML = "";
      }
    };
  }, [DT_LANG_URL]);

  useEffect(() => {
    if (!dtRef.current || !initializedRef.current) return;

    try {
      const dt = dtRef.current;
      const page = dt.page();
      const search = dt.search();
      const order = dt.order();

      dt.clear();
      dt.rows.add(inventories);
      dt.draw(false);
      dt.order(order).draw(false);
      dt.search(search).draw(false);
      dt.page(page).draw(false);
    } catch (error) {
      console.error("Erreur mise à jour DataTable:", error);
    }
  }, [inventories]);

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

  function openViewModal(row) {
    setViewRow(row);
    setShowViewModal(true);
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
      min_stock: row.min_stock || 0,
      is_available: !!row.is_available,
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

  function closeViewModal() {
    setShowViewModal(false);
    setViewRow(null);
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
    setAdjustForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleTransferChange(e) {
    const { name, value } = e.target;
    setTransferForm((prev) => ({ ...prev, [name]: value }));
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
        await inventoryApi.update(editingRow.encrypted_id || editingRow.id, payload);
      } else {
        await inventoryApi.create(payload);
      }

      closeCreateEditModal();
      reload?.();
    } catch (error) {
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
        product_id: Number(transferForm.product_id || transferRow.product_id || product?.id),
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

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Inventaire</h6>
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
            + Ajouter un inventaire
          </button>
        </div>

        <div className="table-responsive">
          <table ref={tableRef} className="table table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>Ville</th>
                <th>Prix</th>
                <th>Prix barre</th>
                <th>Qte</th>
                <th>Reserve</th>
                <th>Stock min</th>
                <th>Disponible</th>
                <th>Statut</th>
                <th>Creation</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody />
          </table>
        </div>
      </div>

      {showViewModal && viewRow && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detail inventaire</h5>
                <button type="button" className="btn-close" onClick={closeViewModal} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label text-muted small">Ville</label>
                    <div className="form-control bg-light">{viewRow.city?.name || "-"}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label text-muted small">Produit</label>
                    <div className="form-control bg-light">{product?.name || "-"}</div>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label text-muted small">Prix</label>
                    <div className="form-control bg-light">{formatPrice(viewRow.price)}</div>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label text-muted small">Prix barre</label>
                    <div className="form-control bg-light">{formatPrice(viewRow.compare_price)}</div>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label text-muted small">Disponible</label>
                    <div className="form-control bg-light">{viewRow.is_available ? "Oui" : "Non"}</div>
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label text-muted small">Quantite</label>
                    <div className="form-control bg-light">{viewRow.quantity ?? 0}</div>
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label text-muted small">Reserve</label>
                    <div className="form-control bg-light">{viewRow.reserved_quantity ?? 0}</div>
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label text-muted small">Stock min</label>
                    <div className="form-control bg-light">{viewRow.min_stock ?? 0}</div>
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label text-muted small">Statut</label>
                    <div className="form-control bg-light">{statusLabel(viewRow.status)}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label text-muted small">Cree le</label>
                    <div className="form-control bg-light">{formatDate(viewRow.created_at)}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label text-muted small">Mis a jour le</label>
                    <div className="form-control bg-light">{formatDate(viewRow.updated_at)}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label text-muted small">Raison</label>
                    <div className="form-control bg-light">{viewRow.reason || "-"}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label text-muted small">Note</label>
                    <div className="form-control bg-light">{viewRow.note || "-"}</div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={closeViewModal}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateEditModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingRow ? "Modifier l'inventaire" : "Ajouter un inventaire"}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeCreateEditModal} />
                </div>
                <div className="modal-body">
                  {apiErrorMessage ? <div className="alert alert-danger">{apiErrorMessage}</div> : null}

                  <div className="mb-3">
                    <label className="form-label">Ville</label>
                    <select
                      name="city_id"
                      className={`form-select ${getFieldError("city_id") ? "is-invalid" : ""}`}
                      value={form.city_id}
                      onChange={handleChange}
                      required
                      disabled={!!editingRow || loadingCities}
                    >
                      <option value="">-- Selectionner une ville --</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                    {getFieldError("city_id") ? (
                      <div className="invalid-feedback">{getFieldError("city_id")}</div>
                    ) : null}
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
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
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">Prix barre</label>
                      <input
                        type="number"
                        name="compare_price"
                        className={`form-control ${getFieldError("compare_price") ? "is-invalid" : ""}`}
                        value={form.compare_price}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">Quantite</label>
                      <input
                        type="number"
                        name="quantity"
                        className={`form-control ${getFieldError("quantity") ? "is-invalid" : ""}`}
                        value={form.quantity}
                        onChange={handleChange}
                        min="0"
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">Stock minimum</label>
                      <input
                        type="number"
                        name="min_stock"
                        className={`form-control ${getFieldError("min_stock") ? "is-invalid" : ""}`}
                        value={form.min_stock}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-check mt-3">
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

                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={closeCreateEditModal} disabled={submitting}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Enregistrement..." : editingRow ? "Mettre a jour" : "Enregistrer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAdjustModal && adjustingRow && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmitAdjust}>
                <div className="modal-header">
                  <h5 className="modal-title">Ajuster le stock</h5>
                  <button type="button" className="btn-close" onClick={closeAdjustModal} />
                </div>

                <div className="modal-body">
                  {apiErrorMessage ? <div className="alert alert-danger">{apiErrorMessage}</div> : null}

                  <div className="mb-3">
                    <label className="form-label">Ville</label>
                    <input type="text" className="form-control" value={adjustingRow.city?.name || ""} disabled />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Type</label>
                    <select name="type" className="form-select" value={adjustForm.type} onChange={handleAdjustChange} required>
                      <option value="up">Augmenter (+)</option>
                      <option value="down">Diminuer (-)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Quantite</label>
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
                    <input
                      type="text"
                      name="reason"
                      className="form-control"
                      value={adjustForm.reason}
                      onChange={handleAdjustChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Note</label>
                    <textarea
                      name="note"
                      className="form-control"
                      rows={3}
                      value={adjustForm.note}
                      onChange={handleAdjustChange}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={closeAdjustModal} disabled={submitting}>
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
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmitTransfer}>
                <div className="modal-header">
                  <h5 className="modal-title">Transferer le stock</h5>
                  <button type="button" className="btn-close" onClick={closeTransferModal} />
                </div>

                <div className="modal-body">
                  {apiErrorMessage ? <div className="alert alert-danger">{apiErrorMessage}</div> : null}

                  <div className="mb-3">
                    <label className="form-label">Ville source</label>
                    <input type="text" className="form-control" value={transferRow.city?.name || ""} disabled />
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
                      <option value="">-- Selectionner une ville --</option>
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
                    <label className="form-label">Quantite</label>
                    <input
                      type="number"
                      name="quantity"
                      className="form-control"
                      value={transferForm.quantity}
                      onChange={handleTransferChange}
                      min="1"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Raison</label>
                    <input
                      type="text"
                      name="reason"
                      className="form-control"
                      value={transferForm.reason}
                      onChange={handleTransferChange}
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
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={closeTransferModal} disabled={submitting}>
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
