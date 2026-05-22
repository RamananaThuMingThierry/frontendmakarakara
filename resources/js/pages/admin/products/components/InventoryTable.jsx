import { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";
import { cityApi } from "@/api/cities";
import { inventoryApi } from "@/api/inventories";
import { useI18n } from "../../../../hooks/website/I18nContext";

function badgeStatus(status) {
  const map = { ok: "success", low_stock: "warning", out_of_stock: "danger", inactive: "secondary" };
  return map[status] || "secondary";
}

export default function InventoryTable({ product, reload }) {
  const { lang, t } = useI18n();
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
  const [form, setForm] = useState({ product_id: "", city_id: "", price: "", compare_price: "", quantity: 0, min_stock: 0, is_available: true, reason: "", note: "" });
  const [adjustForm, setAdjustForm] = useState({ product_id: "", city_id: "", type: "up", quantity: "", reason: "", note: "" });
  const [transferForm, setTransferForm] = useState({ product_id: "", city_from_id: "", city_to_id: "", quantity: "", reason: "", note: "" });

  function formatDate(value) {
    if (!value) return "-";
    try { return new Date(value).toLocaleString(lang === "en" ? "en-US" : lang); } catch { return value; }
  }
  function formatPrice(value) {
    return `${Number(value || 0).toLocaleString(lang === "en" ? "en-US" : lang)} Ar`;
  }
  function statusLabel(status) {
    const map = {
      ok: t("products.inventory.status.ok", "Normal"),
      low_stock: t("products.inventory.status.low_stock", "Low"),
      out_of_stock: t("products.inventory.status.out_of_stock", "Out of stock"),
      inactive: t("products.inventory.status.inactive", "Inactive"),
    };
    return map[status] || status || "-";
  }

  useEffect(() => { inventoriesRef.current = inventories; }, [inventories]);
  useEffect(() => { fetchCities(); }, []);

  useEffect(() => {
    const tableNode = tableRef.current;
    if (!tableNode) return;
    const $table = $(tableNode);
    try { $table.off("click", ".js-view"); $table.off("click", ".js-edit"); $table.off("click", ".js-adjust"); $table.off("click", ".js-transfer"); } catch {}
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
            { data: "city.name", title: t("products.inventory.table.city", "City"), defaultContent: "-" },
            { data: "price", title: t("products.inventory.table.price", "Price"), render: (value) => `<span class="text-primary fw-bold">${formatPrice(value)}</span>` },
            { data: "compare_price", title: t("products.inventory.table.comparePrice", "Compare price"), render: (value) => formatPrice(value) },
            { data: "quantity", title: t("products.inventory.table.quantity", "Qty"), defaultContent: 0 },
            { data: "reserved_quantity", title: t("products.inventory.table.reserved", "Reserved"), defaultContent: 0 },
            { data: "min_stock", title: t("products.inventory.table.minStock", "Min stock"), defaultContent: 0 },
            { data: "is_available", title: t("products.inventory.table.available", "Available"), render: (value) => value ? '<span class="rounded-pill p-1 badge bg-success"><i class="bi bi-check"></i></span>' : '<span class="rounded-pill p-1 badge bg-danger"><i class="bi bi-x-circle"></i></span>' },
            { data: "status", title: t("products.inventory.table.status", "Status"), render: (value) => `<span class="badge bg-${badgeStatus(value)}">${statusLabel(value)}</span>` },
            { data: "created_at", title: t("products.inventory.table.createdAt", "Created"), render: (value) => formatDate(value) },
            {
              data: null, title: t("products.inventory.table.actions", "Actions"), orderable: false, searchable: false, className: "text-end",
              render: (d, tt, row) => `
                <button class="btn btn-sm btn-outline-info me-2 js-view" data-id="${row.id}"><i class="bi bi-eye me-1"></i>${t("common.view", "View")}</button>
                <button class="btn btn-sm btn-outline-primary me-2 js-edit" data-id="${row.id}"><i class="bi bi-pencil me-1"></i>${t("products.actions.edit", "Edit")}</button>
                <button class="btn btn-sm btn-outline-success me-2 js-adjust" data-id="${row.id}"><i class="bi bi-sliders me-1"></i>${t("products.inventory.actions.adjust", "Adjust")}</button>
                <button class="btn btn-sm btn-outline-dark js-transfer" data-id="${row.id}"><i class="bi bi-arrow-left-right me-1"></i>${t("products.inventory.actions.transfer", "Transfer")}</button>
              `,
            },
          ],
        });
      }
      initializedRef.current = true;
    } catch (error) {
      console.error("DataTable init error:", error);
    }

    $table.on("click", ".js-view", (e) => { const row = inventoriesRef.current.find((item) => Number(item.id) === Number($(e.currentTarget).data("id"))); if (row) openViewModal(row); });
    $table.on("click", ".js-edit", (e) => { const row = inventoriesRef.current.find((item) => Number(item.id) === Number($(e.currentTarget).data("id"))); if (row) openEditModal(row); });
    $table.on("click", ".js-adjust", (e) => { const row = inventoriesRef.current.find((item) => Number(item.id) === Number($(e.currentTarget).data("id"))); if (row) openAdjustModal(row); });
    $table.on("click", ".js-transfer", (e) => { const row = inventoriesRef.current.find((item) => Number(item.id) === Number($(e.currentTarget).data("id"))); if (row) openTransferModal(row); });

    return () => {
      try { $table.off("click", ".js-view"); $table.off("click", ".js-edit"); $table.off("click", ".js-adjust"); $table.off("click", ".js-transfer"); } catch {}
      try { if (dtRef.current && $.fn.dataTable.isDataTable(tableNode)) dtRef.current.destroy(); } catch {}
      dtRef.current = null;
      initializedRef.current = false;
      if (tableNode.tBodies?.[0]) tableNode.tBodies[0].innerHTML = "";
    };
  }, [DT_LANG_URL, lang, t]);

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
      console.error("DataTable update error:", error);
    }
  }, [inventories]);

  async function fetchCities() {
    try {
      setLoadingCities(true);
      const response = await cityApi.index();
      setCities(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Cities load error:", error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  }
  function resetErrors() { setApiErrorMessage(""); setFormErrors({}); }
  function extractRequestErrors(error) { const data = error?.response?.data || error || {}; return { message: data.message || t("products.inventory.errors.generic", "An error occurred."), errors: data.errors || {} }; }
  function getFieldError(field) { return formErrors?.[field]?.[0] || ""; }
  function resetForm() { setForm({ product_id: product?.id || "", city_id: "", price: product?.price || "", compare_price: product?.compare_price || "", quantity: 0, min_stock: 0, is_available: true, reason: "", note: "" }); }
  function resetAdjustForm(row = null) { setAdjustForm({ product_id: row?.product_id || product?.id || "", city_id: row?.city_id || "", type: "up", quantity: "", reason: "", note: "" }); }
  function resetTransferForm(row = null) { setTransferForm({ product_id: row?.product_id || product?.id || "", city_from_id: row?.city_id || "", city_to_id: "", quantity: "", reason: "", note: "" }); }
  function openCreateModal() { setEditingRow(null); resetForm(); resetErrors(); setShowCreateEditModal(true); }
  function openViewModal(row) { setViewRow(row); setShowViewModal(true); }
  function openEditModal(row) { setEditingRow(row); resetErrors(); setForm({ product_id: row.product_id || product?.id || "", city_id: row.city_id || "", price: row.price || "", compare_price: row.compare_price || "", quantity: row.quantity || 0, min_stock: row.min_stock || 0, is_available: !!row.is_available, reason: "", note: "" }); setShowCreateEditModal(true); }
  function openAdjustModal(row) { setAdjustingRow(row); resetAdjustForm(row); resetErrors(); setShowAdjustModal(true); }
  function openTransferModal(row) { setTransferRow(row); resetTransferForm(row); resetErrors(); setShowTransferModal(true); }
  function closeCreateEditModal() { setShowCreateEditModal(false); setEditingRow(null); resetForm(); resetErrors(); }
  function closeViewModal() { setShowViewModal(false); setViewRow(null); }
  function closeAdjustModal() { setShowAdjustModal(false); setAdjustingRow(null); resetAdjustForm(); resetErrors(); }
  function closeTransferModal() { setShowTransferModal(false); setTransferRow(null); resetTransferForm(); resetErrors(); }
  function handleChange(e) { const { name, value, type, checked } = e.target; setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value })); }
  function handleAdjustChange(e) { const { name, value } = e.target; setAdjustForm((prev) => ({ ...prev, [name]: value })); }
  function handleTransferChange(e) { const { name, value } = e.target; setTransferForm((prev) => ({ ...prev, [name]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    resetErrors();
    const payload = { product_id: Number(form.product_id || product?.id), city_id: Number(form.city_id), price: Number(form.price), compare_price: Number(form.compare_price || 0), quantity: Number(form.quantity), min_stock: Number(form.min_stock || 0), is_available: form.is_available, reason: form.reason || "initial_stock", note: form.note || null };
    try {
      setSubmitting(true);
      if (editingRow) await inventoryApi.update(editingRow.encrypted_id || editingRow.id, payload);
      else await inventoryApi.create(payload);
      closeCreateEditModal();
      reload?.();
    } catch (error) {
      const { message, errors } = extractRequestErrors(error);
      setApiErrorMessage(message);
      setFormErrors(errors);
    } finally { setSubmitting(false); }
  }

  async function handleSubmitAdjust(e) {
    e.preventDefault(); resetErrors(); if (!adjustingRow) return;
    try {
      setSubmitting(true);
      await inventoryApi.adjust(adjustingRow.encrypted_id || adjustingRow.id, { product_id: Number(adjustForm.product_id || adjustingRow.product_id || product?.id), city_id: Number(adjustForm.city_id || adjustingRow.city_id), quantity: Number(adjustForm.quantity), type: adjustForm.type, reason: adjustForm.reason, note: adjustForm.note || null });
      closeAdjustModal(); reload?.();
    } catch (error) {
      const { message, errors } = extractRequestErrors(error); setApiErrorMessage(message); setFormErrors(errors);
    } finally { setSubmitting(false); }
  }

  async function handleSubmitTransfer(e) {
    e.preventDefault(); resetErrors(); if (!transferRow) return;
    try {
      setSubmitting(true);
      await inventoryApi.transfert(transferRow.encrypted_id || transferRow.id, { product_id: Number(transferForm.product_id || transferRow.product_id || product?.id), city_from_id: Number(transferForm.city_from_id || transferRow.city_id), city_to_id: Number(transferForm.city_to_id), quantity: Number(transferForm.quantity), reason: transferForm.reason, note: transferForm.note || null });
      closeTransferModal(); reload?.();
    } catch (error) {
      const { message, errors } = extractRequestErrors(error); setApiErrorMessage(message); setFormErrors(errors);
    } finally { setSubmitting(false); }
  }

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">{t("products.tabs.inventory", "Inventory")}</h6>
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>+ {t("products.inventory.actions.add", "Add inventory")}</button>
        </div>
        <div className="table-responsive">
          <table ref={tableRef} className="table table-sm align-middle mb-0"><thead><tr><th>{t("products.inventory.table.city", "City")}</th><th>{t("products.inventory.table.price", "Price")}</th><th>{t("products.inventory.table.comparePrice", "Compare price")}</th><th>{t("products.inventory.table.quantity", "Qty")}</th><th>{t("products.inventory.table.reserved", "Reserved")}</th><th>{t("products.inventory.table.minStock", "Min stock")}</th><th>{t("products.inventory.table.available", "Available")}</th><th>{t("products.inventory.table.status", "Status")}</th><th>{t("products.inventory.table.createdAt", "Created")}</th><th className="text-end">{t("products.inventory.table.actions", "Actions")}</th></tr></thead><tbody /></table>
        </div>
      </div>

      {showViewModal && viewRow ? <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}><div className="modal-dialog modal-lg"><div className="modal-content"><div className="modal-header"><h5 className="modal-title">{t("products.inventory.viewTitle", "Inventory details")}</h5><button type="button" className="btn-close" onClick={closeViewModal} /></div><div className="modal-body"><div className="row g-3"><div className="col-12 col-md-6"><label className="form-label text-muted small">{t("products.inventory.table.city", "City")}</label><div className="form-control bg-light">{viewRow.city?.name || "-"}</div></div><div className="col-12 col-md-6"><label className="form-label text-muted small">{t("products.fields.product", "Product")}</label><div className="form-control bg-light">{product?.name || "-"}</div></div><div className="col-12 col-md-4"><label className="form-label text-muted small">{t("products.inventory.table.price", "Price")}</label><div className="form-control bg-light">{formatPrice(viewRow.price)}</div></div><div className="col-12 col-md-4"><label className="form-label text-muted small">{t("products.inventory.table.comparePrice", "Compare price")}</label><div className="form-control bg-light">{formatPrice(viewRow.compare_price)}</div></div><div className="col-12 col-md-4"><label className="form-label text-muted small">{t("products.inventory.table.available", "Available")}</label><div className="form-control bg-light">{viewRow.is_available ? t("common.yes", "Yes") : t("common.no", "No")}</div></div><div className="col-12 col-md-3"><label className="form-label text-muted small">{t("products.inventory.table.quantity", "Qty")}</label><div className="form-control bg-light">{viewRow.quantity ?? 0}</div></div><div className="col-12 col-md-3"><label className="form-label text-muted small">{t("products.inventory.table.reserved", "Reserved")}</label><div className="form-control bg-light">{viewRow.reserved_quantity ?? 0}</div></div><div className="col-12 col-md-3"><label className="form-label text-muted small">{t("products.inventory.table.minStock", "Min stock")}</label><div className="form-control bg-light">{viewRow.min_stock ?? 0}</div></div><div className="col-12 col-md-3"><label className="form-label text-muted small">{t("products.inventory.table.status", "Status")}</label><div className="form-control bg-light">{statusLabel(viewRow.status)}</div></div><div className="col-12 col-md-6"><label className="form-label text-muted small">{t("products.inventory.meta.createdAt", "Created at")}</label><div className="form-control bg-light">{formatDate(viewRow.created_at)}</div></div><div className="col-12 col-md-6"><label className="form-label text-muted small">{t("products.inventory.meta.updatedAt", "Updated at")}</label><div className="form-control bg-light">{formatDate(viewRow.updated_at)}</div></div><div className="col-12 col-md-6"><label className="form-label text-muted small">{t("products.inventory.meta.reason", "Reason")}</label><div className="form-control bg-light">{viewRow.reason || "-"}</div></div><div className="col-12 col-md-6"><label className="form-label text-muted small">{t("products.inventory.meta.note", "Note")}</label><div className="form-control bg-light">{viewRow.note || "-"}</div></div></div></div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={closeViewModal}>{t("common.close", "Close")}</button></div></div></div></div> : null}

      {showCreateEditModal ? <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}><div className="modal-dialog modal-lg"><div className="modal-content"><form onSubmit={handleSubmit}><div className="modal-header"><h5 className="modal-title">{editingRow ? t("products.inventory.editTitle", "Edit inventory") : t("products.inventory.createTitle", "Add inventory")}</h5><button type="button" className="btn-close" onClick={closeCreateEditModal} /></div><div className="modal-body">{apiErrorMessage ? <div className="alert alert-danger">{apiErrorMessage}</div> : null}<div className="mb-3"><label className="form-label">{t("products.inventory.table.city", "City")}</label><select name="city_id" className={`form-select ${getFieldError("city_id") ? "is-invalid" : ""}`} value={form.city_id} onChange={handleChange} required disabled={!!editingRow || loadingCities}><option value="">{t("products.inventory.selectCity", "Select a city")}</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}</select>{getFieldError("city_id") ? <div className="invalid-feedback">{getFieldError("city_id")}</div> : null}</div><div className="row g-3"><div className="col-12 col-md-6"><label className="form-label">{t("products.inventory.table.price", "Price")}</label><input type="number" name="price" className={`form-control ${getFieldError("price") ? "is-invalid" : ""}`} value={form.price} onChange={handleChange} min="0" required /></div><div className="col-12 col-md-6"><label className="form-label">{t("products.inventory.table.comparePrice", "Compare price")}</label><input type="number" name="compare_price" className={`form-control ${getFieldError("compare_price") ? "is-invalid" : ""}`} value={form.compare_price} onChange={handleChange} min="0" /></div><div className="col-12 col-md-6"><label className="form-label">{t("products.inventory.table.quantity", "Qty")}</label><input type="number" name="quantity" className={`form-control ${getFieldError("quantity") ? "is-invalid" : ""}`} value={form.quantity} onChange={handleChange} min="0" required /></div><div className="col-12 col-md-6"><label className="form-label">{t("products.inventory.table.minStock", "Min stock")}</label><input type="number" name="min_stock" className={`form-control ${getFieldError("min_stock") ? "is-invalid" : ""}`} value={form.min_stock} onChange={handleChange} min="0" /></div></div><div className="form-check mt-3"><input id="is_available" type="checkbox" name="is_available" className="form-check-input" checked={form.is_available} onChange={handleChange} /><label htmlFor="is_available" className="form-check-label">{t("products.inventory.table.available", "Available")}</label></div></div><div className="modal-footer"><button type="button" className="btn btn-light" onClick={closeCreateEditModal} disabled={submitting}>{t("common.cancel", "Cancel")}</button><button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? t("common.saving", "Saving...") : editingRow ? t("products.actions.update", "Update") : t("common.save", "Save")}</button></div></form></div></div></div> : null}

      {showAdjustModal && adjustingRow ? <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}><div className="modal-dialog"><div className="modal-content"><form onSubmit={handleSubmitAdjust}><div className="modal-header"><h5 className="modal-title">{t("products.inventory.adjustTitle", "Adjust stock")}</h5><button type="button" className="btn-close" onClick={closeAdjustModal} /></div><div className="modal-body">{apiErrorMessage ? <div className="alert alert-danger">{apiErrorMessage}</div> : null}<div className="mb-3"><label className="form-label">{t("products.inventory.table.city", "City")}</label><input type="text" className="form-control" value={adjustingRow.city?.name || ""} disabled /></div><div className="mb-3"><label className="form-label">{t("products.movements.table.type", "Type")}</label><select name="type" className="form-select" value={adjustForm.type} onChange={handleAdjustChange} required><option value="up">{t("products.inventory.adjust.up", "Increase (+)")}</option><option value="down">{t("products.inventory.adjust.down", "Decrease (-)")}</option></select></div><div className="mb-3"><label className="form-label">{t("products.inventory.table.quantity", "Qty")}</label><input type="number" name="quantity" className="form-control" value={adjustForm.quantity} onChange={handleAdjustChange} min="1" required /></div><div className="mb-3"><label className="form-label">{t("products.inventory.meta.reason", "Reason")}</label><input type="text" name="reason" className="form-control" value={adjustForm.reason} onChange={handleAdjustChange} required /></div><div className="mb-3"><label className="form-label">{t("products.inventory.meta.note", "Note")}</label><textarea name="note" className="form-control" rows={3} value={adjustForm.note} onChange={handleAdjustChange} /></div></div><div className="modal-footer"><button type="button" className="btn btn-light" onClick={closeAdjustModal} disabled={submitting}>{t("common.cancel", "Cancel")}</button><button type="submit" className="btn btn-success" disabled={submitting}>{submitting ? t("products.inventory.validating", "Validating...") : t("products.inventory.adjust.confirm", "Confirm adjustment")}</button></div></form></div></div></div> : null}

      {showTransferModal && transferRow ? <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}><div className="modal-dialog"><div className="modal-content"><form onSubmit={handleSubmitTransfer}><div className="modal-header"><h5 className="modal-title">{t("products.inventory.transferTitle", "Transfer stock")}</h5><button type="button" className="btn-close" onClick={closeTransferModal} /></div><div className="modal-body">{apiErrorMessage ? <div className="alert alert-danger">{apiErrorMessage}</div> : null}<div className="mb-3"><label className="form-label">{t("products.movements.table.cityFrom", "Source city")}</label><input type="text" className="form-control" value={transferRow.city?.name || ""} disabled /></div><div className="mb-3"><label className="form-label">{t("products.movements.table.cityTo", "Destination city")}</label><select name="city_to_id" className="form-select" value={transferForm.city_to_id} onChange={handleTransferChange} required><option value="">{t("products.inventory.selectCity", "Select a city")}</option>{cities.filter((city) => city.id !== transferRow.city_id).map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}</select></div><div className="mb-3"><label className="form-label">{t("products.inventory.table.quantity", "Qty")}</label><input type="number" name="quantity" className="form-control" value={transferForm.quantity} onChange={handleTransferChange} min="1" required /></div><div className="mb-3"><label className="form-label">{t("products.inventory.meta.reason", "Reason")}</label><input type="text" name="reason" className="form-control" value={transferForm.reason} onChange={handleTransferChange} required /></div><div className="mb-3"><label className="form-label">{t("products.inventory.meta.note", "Note")}</label><textarea name="note" className="form-control" rows={3} value={transferForm.note} onChange={handleTransferChange} /></div></div><div className="modal-footer"><button type="button" className="btn btn-light" onClick={closeTransferModal} disabled={submitting}>{t("common.cancel", "Cancel")}</button><button type="submit" className="btn btn-dark" disabled={submitting}>{submitting ? t("products.inventory.validating", "Validating...") : t("products.inventory.transfer.confirm", "Confirm transfer")}</button></div></form></div></div></div> : null}
    </div>
  );
}
