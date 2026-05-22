import { useEffect, useMemo, useRef, useState } from "react";
import { adminOrdersApi } from "../../../api/admin_orders";
import { useI18n } from "../../../hooks/website/I18nContext";

import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

const STATUS_BADGES = {
  pending: "warning",
  confirmed: "info",
  processing: "primary",
  delivered: "success",
  cancelled: "danger",
};

const PAYMENT_STATUS_BADGES = {
  unpaid: "secondary",
  pending_verification: "warning",
  paid: "success",
  refunded: "dark",
};

function getGoogleMapsUrl(address) {
  const latitude = address?.latitude;
  const longitude = address?.longitude;
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) return "";
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

function getPaymentMethodLabel(paymentMethod) {
  if (!paymentMethod) return "-";
  if (typeof paymentMethod === "string") return paymentMethod;
  return paymentMethod.name || paymentMethod.code || paymentMethod.label || "-";
}

export default function OrdersPage() {
  const { lang, t } = useI18n();
  const DT_LANG_URL = useMemo(() => `/lang/datatables/${lang}.json`, [lang]);

  const statusLabels = useMemo(() => ({
    pending: t("orders.status.pending", "Pending"),
    confirmed: t("orders.status.confirmed", "Confirmed"),
    processing: t("orders.status.processing", "Processing"),
    delivered: t("orders.status.delivered", "Delivered"),
    cancelled: t("orders.status.cancelled", "Cancelled"),
  }), [t]);

  const paymentStatusLabels = useMemo(() => ({
    unpaid: t("orders.paymentStatus.unpaid", "Unpaid"),
    pending_verification: t("orders.paymentStatus.pending_verification", "Verification"),
    paid: t("orders.paymentStatus.paid", "Paid"),
    refunded: t("orders.paymentStatus.refunded", "Refunded"),
  }), [t]);

  function formatDate(value) {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString(lang === "en" ? "en-US" : lang);
    } catch {
      return value;
    }
  }

  function formatPrice(value) {
    return `${Number(value || 0).toLocaleString(lang === "en" ? "en-US" : lang, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} MGA`;
  }

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [showOpen, setShowOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [deliveryFeeInput, setDeliveryFeeInput] = useState("");
  const [notesInput, setNotesInput] = useState("");

  const tableRef = useRef(null);
  const dtRef = useRef(null);
  const itemsRef = useRef(items);
  const orderItemsTableRef = useRef(null);
  const orderItemsDtRef = useRef(null);

  async function load({ mode = "initial" } = {}) {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);

    setError("");
    try {
      const data = await adminOrdersApi.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || t("orders.error.load", "Unable to load orders."));
    } finally {
      if (mode === "initial") setLoading(false);
      else setRefreshing(false);
    }
  }

  useEffect(() => {
    load({ mode: "initial" });
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  async function openShow(item) {
    setShowOpen(true);
    setShowLoading(true);
    setSelected(null);
    setDeliveryFeeInput("");
    setNotesInput("");

    try {
      const data = await adminOrdersApi.show(item.encrypted_id || item.id);
      setSelected(data);
      setDeliveryFeeInput(String(data?.delivery_fee ?? 0));
      setNotesInput(data?.notes || "");
    } catch (e) {
      setError(e?.response?.data?.message || t("orders.error.details", "Unable to load order details."));
      setShowOpen(false);
    } finally {
      setShowLoading(false);
    }
  }

  function closeShow() {
    if (showLoading || actionLoading) return;
    setShowOpen(false);
    setSelected(null);
    setDeliveryFeeInput("");
    setNotesInput("");
  }

  async function runAction(actionName, request) {
    if (!selected?.encrypted_id || actionLoading) return;
    setError("");
    setActionLoading(actionName);
    try {
      const data = await request(selected.encrypted_id);
      setSelected(data);
      setDeliveryFeeInput(String(data?.delivery_fee ?? 0));
      setNotesInput(data?.notes || "");
      setItems((current) => current.map((item) => (item.id === data.id ? data : item)));
      await load({ mode: "refresh" });
    } catch (e) {
      const message = e?.response?.data?.errors ? Object.values(e.response.data.errors).flat().join(" ") : e?.response?.data?.message;
      setError(message || t("orders.error.action", "Action unavailable for this order."));
    } finally {
      setActionLoading("");
    }
  }

  function canConfirm(order) { return order?.status === "pending"; }
  function canProcess(order) { return order?.status === "confirmed"; }
  function canMarkPaid(order) { return order?.status !== "cancelled" && order?.payment_status !== "paid"; }
  function canDeliver(order) { return order?.status === "confirmed" || order?.status === "processing"; }
  function canCancel(order) { return order?.status === "pending" || order?.status === "confirmed" || order?.status === "processing"; }
  function canSendReceipt(order) { return order?.payment_status === "paid" && !order?.receipt?.sent_at; }
  function canUpdateDeliveryFee(order) { return order?.status === "pending"; }

  useEffect(() => {
    const tableNode = tableRef.current;
    if (loading || !tableNode) return;
    const $table = $(tableNode);

    try { $table.off("click", ".js-show"); } catch {}
    try {
      if ($.fn.dataTable.isDataTable(tableNode)) {
        const existing = $table.DataTable();
        existing.clear();
        existing.destroy();
      }
    } catch {}
    if (tableNode.tBodies?.[0]) tableNode.tBodies[0].innerHTML = "";

    dtRef.current = $table.DataTable({
      data: [],
      pageLength: 10,
      lengthMenu: [10, 15, 25, 50, 100],
      ordering: true,
      searching: true,
      responsive: true,
      language: { url: DT_LANG_URL },
      columns: [
        { data: null, title: "#", render: (d, tt, row, meta) => meta.row + 1 },
        { data: "order_number", title: t("orders.table.order", "Order"), defaultContent: "-" },
        {
          data: null,
          title: t("orders.table.customer", "Customer"),
          render: (value, type, row) => `<div class="fw-semibold">${row.user_name || "-"}</div><div class="small text-muted">${row.user_email || "-"}</div>`,
        },
        { data: "items_count", title: t("orders.table.items", "Items"), defaultContent: 0 },
        { data: "quantity", title: t("orders.table.quantity", "Quantity"), defaultContent: 0 },
        {
          data: "status",
          title: t("orders.table.orderStatus", "Order"),
          render: (value) => `<span class="badge text-bg-${STATUS_BADGES[value] || "secondary"}">${statusLabels[value] || value || "-"}</span>`,
        },
        {
          data: "payment_status",
          title: t("orders.table.paymentStatus", "Payment"),
          render: (value) => `<span class="badge text-bg-${PAYMENT_STATUS_BADGES[value] || "secondary"}">${paymentStatusLabels[value] || value || "-"}</span>`,
        },
        { data: "total", title: t("orders.table.total", "Total"), render: (value) => formatPrice(value) },
        { data: "created_at", title: t("orders.table.date", "Date"), render: (value) => formatDate(value) },
        {
          data: null,
          title: t("orders.table.actions", "Actions"),
          orderable: false,
          searchable: false,
          className: "text-end",
          render: (value, type, row) => `<button class="btn btn-sm btn-outline-primary js-show" data-id="${row.id}"><i class="bi bi-eye me-1"></i>${t("orders.actions.view", "View")}</button>`,
        },
      ],
    });

    $table.on("click", ".js-show", (e) => {
      const id = Number($(e.currentTarget).data("id"));
      const item = itemsRef.current.find((current) => Number(current.id) === id);
      if (item) openShow(item);
    });

    return () => {
      try { $table.off("click", ".js-show"); } catch {}
      try {
        if (dtRef.current) {
          dtRef.current.clear();
          dtRef.current.destroy();
        }
      } catch {}
      dtRef.current = null;
      if (tableNode.tBodies?.[0]) tableNode.tBodies[0].innerHTML = "";
    };
  }, [DT_LANG_URL, loading, t, statusLabels, paymentStatusLabels]);

  useEffect(() => {
    if (!dtRef.current) return;
    const dt = dtRef.current;
    const page = dt.page();
    const search = dt.search();
    const order = dt.order();
    dt.clear();
    dt.rows.add(items);
    dt.draw(false);
    dt.order(order).draw(false);
    dt.search(search).draw(false);
    dt.page(page).draw(false);
  }, [items]);

  useEffect(() => {
    const tableNode = orderItemsTableRef.current;
    const orderItems = Array.isArray(selected?.items) ? selected.items : [];

    if (!showOpen || showLoading || !selected || !tableNode || orderItems.length === 0) {
      if (orderItemsDtRef.current) {
        try {
          orderItemsDtRef.current.clear();
          orderItemsDtRef.current.destroy();
        } catch {}
        orderItemsDtRef.current = null;
      }
      if (tableNode?.tBodies?.[0]) tableNode.tBodies[0].innerHTML = "";
      return;
    }

    const $table = $(tableNode);
    try {
      if ($.fn.dataTable.isDataTable(tableNode)) {
        const existing = $table.DataTable();
        existing.clear();
        existing.destroy();
      }
    } catch {}
    if (tableNode.tBodies?.[0]) tableNode.tBodies[0].innerHTML = "";

    orderItemsDtRef.current = $table.DataTable({
      data: orderItems,
      pageLength: 5,
      lengthMenu: [5, 10, 25, 50],
      ordering: true,
      searching: true,
      responsive: true,
      language: { url: DT_LANG_URL },
      columns: [
        { data: "product_name", title: t("orders.items.product", "Product"), defaultContent: "-" },
        { data: "sku", title: t("orders.items.sku", "SKU"), defaultContent: "-" },
        { data: "quantity", title: t("orders.items.quantity", "Quantity"), defaultContent: 0 },
        { data: "unit_price", title: t("orders.items.unitPrice", "Unit price"), render: (value) => formatPrice(value) },
        { data: "line_total", title: t("orders.items.lineTotal", "Line total"), render: (value) => formatPrice(value) },
      ],
    });

    return () => {
      try {
        if (orderItemsDtRef.current) {
          orderItemsDtRef.current.clear();
          orderItemsDtRef.current.destroy();
        }
      } catch {}
      orderItemsDtRef.current = null;
      if (tableNode.tBodies?.[0]) tableNode.tBodies[0].innerHTML = "";
    };
  }, [DT_LANG_URL, selected, showLoading, showOpen, t]);

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">{t("orders.title", "Order management")}</h4>
          <div className="text-muted small">{t("orders.subtitle", "Track customer orders and review order items.")}</div>
          <div className="text-muted small">{t("orders.total", "Total")}: {items.length}</div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => load({ mode: "refresh" })} disabled={loading || refreshing}>
            {loading || refreshing ? <><span className="spinner-border spinner-border-sm me-2" />{t("orders.refreshing", "Refreshing...")}</> : <><i className="bi bi-arrow-clockwise me-2" />{t("orders.refresh", "Refresh")}</>}
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {error ? <div className="alert alert-danger">{error}</div> : null}
          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted"><span className="spinner-border spinner-border-sm" />{t("orders.loading", "Loading...")}</div>
          ) : items.length === 0 ? (
            <div className="text-center text-muted py-4">{t("orders.empty", "No orders found.")}</div>
          ) : (
            <div className="table-responsive">
              <table ref={tableRef} className="table align-middle mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th>#</th><th>{t("orders.table.order", "Order")}</th><th>{t("orders.table.customer", "Customer")}</th><th>{t("orders.table.items", "Items")}</th><th>{t("orders.table.quantity", "Quantity")}</th><th>{t("orders.table.status", "Status")}</th><th>{t("orders.table.paymentStatus", "Payment")}</th><th>{t("orders.table.total", "Total")}</th><th>{t("orders.table.date", "Date")}</th><th className="text-end">{t("orders.table.actions", "Actions")}</th>
                  </tr>
                </thead>
                <tbody />
              </table>
            </div>
          )}
        </div>
      </div>

      {showOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title text-warning">{t("orders.show.title", "Order details")}</h5>
                  <button type="button" className="btn-close" onClick={closeShow} disabled={showLoading} />
                </div>

                <div className="modal-body">
                  {showLoading ? (
                    <div className="d-flex align-items-center gap-2 text-muted"><span className="spinner-border spinner-border-sm" />{t("orders.show.loading", "Loading details...")}</div>
                  ) : selected ? (
                    <div className="row g-3">
                      <div className="col-12 col-lg-6">
                        <div className="border rounded-3 p-3 h-100">
                          <div className="text-muted small mb-1">{t("orders.show.order", "Order")}</div>
                          <div className="fw-semibold">{selected.order_number || "-"}</div>
                          <hr />
                          <div className="text-muted small mb-1">{t("orders.show.customer", "Customer")}</div>
                          <div>{selected.user_name || "-"}</div>
                          <div className="small text-primary">{selected.user_email || "-"}</div>
                          <hr />
                          <div className="text-muted small mb-1">{t("orders.show.address", "Address")}</div>
                          <div>{selected.address?.full_name || "-"}</div>
                          <div>{selected.address?.phone || "-"}</div>
                          <div>{[selected.address?.address_line1, selected.address?.address_line2, selected.address?.city_name, selected.address?.region].filter(Boolean).join(", ") || "-"}</div>
                          {selected.address?.latitude && selected.address?.longitude ? <div className="mt-2"><div className="small text-muted">GPS: {selected.address.latitude}, {selected.address.longitude}</div><a href={getGoogleMapsUrl(selected.address)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-dark mt-2"><i className="bi bi-map me-2" />{t("orders.show.openMaps", "Open in Google Maps")}</a></div> : null}
                          <hr />
                          <div className="text-muted small mb-1">{t("orders.show.notes", "Notes")}</div>
                          <div className="mb-2"><textarea className="form-control" rows={4} value={notesInput} onChange={(e) => setNotesInput(e.target.value)} placeholder={t("orders.show.notesPlaceholder", "Add an internal note for this order...")} disabled={!!actionLoading} /></div>
                          <button type="button" className="btn btn-sm btn-outline-warning" disabled={!!actionLoading} onClick={() => runAction("notes", (id) => adminOrdersApi.updateNotes(id, { notes: notesInput }))}>{actionLoading === "notes" ? "..." : t("orders.actions.saveNote", "Save note")}</button>
                        </div>
                      </div>

                      <div className="col-12 col-lg-6">
                        <div className="border rounded-3 p-3 h-100">
                          <div className="text-muted small mb-1">{t("orders.show.orderStatus", "Order status")}</div>
                          <div className="mb-3"><span className={`badge text-bg-${STATUS_BADGES[selected.status] || "secondary"}`}>{statusLabels[selected.status] || selected.status}</span></div>
                          <div className="text-muted small mb-1">{t("orders.show.paymentStatus", "Payment status")}</div>
                          <div className="mb-3"><span className={`badge text-bg-${PAYMENT_STATUS_BADGES[selected.payment_status] || "secondary"}`}>{paymentStatusLabels[selected.payment_status] || selected.payment_status}</span></div>
                          <div className="text-muted small mb-1">{t("orders.show.paymentMethod", "Payment method")}</div>
                          <div className="mb-3">{getPaymentMethodLabel(selected.payment_method_name || selected.payment_method)}</div>
                          <div className="text-muted small mb-1">{t("orders.show.deliveryFee", "Delivery fee")}</div>
                          <div className="mb-3"><div className="input-group"><input type="number" min="0" step="0.01" className="form-control" value={deliveryFeeInput} onChange={(e) => setDeliveryFeeInput(e.target.value)} disabled={!canUpdateDeliveryFee(selected) || !!actionLoading} /><button type="button" className="btn btn-outline-warning" disabled={!canUpdateDeliveryFee(selected) || !!actionLoading} onClick={() => runAction("delivery_fee", (id) => adminOrdersApi.updateDeliveryFee(id, { delivery_fee: Number(deliveryFeeInput || 0) }))}>{actionLoading === "delivery_fee" ? "..." : t("orders.actions.save", "Save")}</button></div><div className="small text-muted mt-2">{t("orders.show.deliveryFeeHelp", "This amount is set by the admin according to delivery distance. `0` means free delivery. The fee should be fixed before confirmation.")}</div></div>
                          <div className="text-muted small mb-1">{t("orders.show.invoice", "Invoice")}</div><div className="mb-3">{selected.invoice?.number || "-"}</div>
                          <div className="text-muted small mb-1">{t("orders.show.receipt", "Receipt")}</div><div className="mb-3">{selected.receipt?.number || "-"}</div>
                          <div className="text-muted small mb-1">{t("orders.show.receiptSentAt", "Receipt sent at")}</div><div className="mb-3">{formatDate(selected.receipt?.sent_at)}</div>
                          <div className="text-muted small mb-1">{t("orders.show.subtotal", "Subtotal")}</div><div className="mb-3">{formatPrice(selected.subtotal)}</div>
                          <div className="text-muted small mb-1">{t("orders.show.discount", "Discount")}</div><div className="mb-3">{formatPrice(selected.discount_total)}</div>
                          <div className="text-muted small mb-1">{t("orders.show.total", "Total")}</div><div className="fw-bold text-danger">{formatPrice(selected.total)}</div>
                          <div className="small text-muted">{t("orders.show.totalHelp", "The total includes the delivery fee set for this order.")}</div>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="border rounded-3 p-3">
                          <div className="text-muted small mb-2">{t("orders.items.title", "Order items")}</div>
                          {Array.isArray(selected.items) && selected.items.length > 0 ? (
                            <div className="table-responsive">
                              <table ref={orderItemsTableRef} className="table align-middle mb-0">
                                <thead>
                                  <tr className="text-muted small">
                                    <th>{t("orders.items.product", "Product")}</th><th>{t("orders.items.sku", "SKU")}</th><th>{t("orders.items.quantity", "Quantity")}</th><th>{t("orders.items.unitPrice", "Unit price")}</th><th>{t("orders.items.lineTotal", "Line total")}</th>
                                  </tr>
                                </thead>
                                <tbody />
                              </table>
                            </div>
                          ) : (
                            <div className="text-muted">{t("orders.items.empty", "No items available.")}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted">{t("orders.show.empty", "No details available.")}</div>
                  )}
                </div>

                <div className="modal-footer">
                  <div className="d-flex flex-wrap gap-2 me-auto">
                    <button type="button" className="btn btn-outline-info" disabled={!canConfirm(selected) || !!actionLoading} onClick={() => runAction("confirm", adminOrdersApi.confirm)}>{actionLoading === "confirm" ? "..." : t("orders.actions.confirm", "Confirm")}</button>
                    <button type="button" className="btn btn-outline-primary" disabled={!canProcess(selected) || !!actionLoading} onClick={() => runAction("processing", adminOrdersApi.startProcessing)}>{actionLoading === "processing" ? "..." : t("orders.actions.processing", "Start processing")}</button>
                    <button type="button" className="btn btn-outline-success" disabled={!canMarkPaid(selected) || !!actionLoading} onClick={() => runAction("paid", adminOrdersApi.markAsPaid)}>{actionLoading === "paid" ? "..." : t("orders.actions.markPaid", "Mark as paid")}</button>
                    <button type="button" className="btn btn-outline-dark" disabled={!canSendReceipt(selected) || !!actionLoading} onClick={() => runAction("receipt", adminOrdersApi.sendReceipt)}>{actionLoading === "receipt" ? "..." : t("orders.actions.sendReceipt", "Send receipt")}</button>
                    <button type="button" className="btn btn-outline-success" disabled={!canDeliver(selected) || !!actionLoading} onClick={() => runAction("deliver", adminOrdersApi.markAsDelivered)}>{actionLoading === "deliver" ? "..." : t("orders.actions.deliver", "Deliver")}</button>
                    <button type="button" className="btn btn-outline-danger" disabled={!canCancel(selected) || !!actionLoading} onClick={() => runAction("cancel", adminOrdersApi.cancel)}>{actionLoading === "cancel" ? "..." : t("orders.actions.cancel", "Cancel")}</button>
                  </div>
                  <button type="button" className="btn btn-outline-secondary" onClick={closeShow} disabled={showLoading}>{t("orders.actions.close", "Close")}</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={closeShow} />
        </>
      )}
    </div>
  );
}
