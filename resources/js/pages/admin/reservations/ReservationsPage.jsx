import { useEffect, useMemo, useRef, useState } from "react";
import { adminReservationsApi } from "../../../api/admin_reservations";
import { useI18n } from "../../../hooks/website/I18nContext";

import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

const STATUS_BADGES = {
  active: "warning",
  released: "secondary",
  consumed: "success",
};

export default function ReservationsPage() {
  const { lang, t } = useI18n();
  const DT_LANG_URL = useMemo(() => `/lang/datatables/${lang}.json`, [lang]);

  const statusLabels = useMemo(() => ({
    active: t("reservations.status.active", "Active"),
    released: t("reservations.status.released", "Released"),
    consumed: t("reservations.status.consumed", "Consumed"),
  }), [t]);

  function formatDate(value) {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString(lang === "en" ? "en-US" : lang);
    } catch {
      return value;
    }
  }

  function formatSource(item) {
    if (item.order_id || item.reference_type?.includes("Order")) return t("reservations.source.order", "Order");
    if (item.cart_id || item.reference_type?.includes("Cart")) return t("reservations.source.cart", "Cart");
    return t("reservations.source.reservation", "Reservation");
  }

  function formatPrice(value) {
    if (value === null || value === undefined || value === "") return "-";
    return `${Number(value).toLocaleString(lang === "en" ? "en-US" : lang, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} Ar`;
  }

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [showOpen, setShowOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const tableRef = useRef(null);
  const dtRef = useRef(null);
  const itemsRef = useRef(items);
  const itemsTableRef = useRef(null);
  const itemsDtRef = useRef(null);

  async function load({ mode = "initial" } = {}) {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);

    setError("");
    try {
      const data = await adminReservationsApi.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || t("reservations.error.load", "Unable to load reservations."));
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

    try {
      const data = await adminReservationsApi.show(item.encrypted_id || item.id);
      setSelected(data);
    } catch (e) {
      setError(e?.response?.data?.message || t("reservations.error.details", "Unable to load reservation details."));
      setShowOpen(false);
    } finally {
      setShowLoading(false);
    }
  }

  function closeShow() {
    if (showLoading) return;
    setShowOpen(false);
    setSelected(null);
  }

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
      data: items,
      pageLength: 10,
      lengthMenu: [10, 15, 25, 50, 100],
      ordering: true,
      searching: true,
      responsive: true,
      language: { url: DT_LANG_URL },
      columns: [
        { data: null, title: "#", render: (d, tt, row, meta) => meta.row + 1 },
        {
          data: null,
          title: t("reservations.table.customer", "Customer"),
          render: (value, type, row) => `<div class="fw-semibold">${row.user_name || "-"}</div><div class="small text-muted">${row.user_email || "-"}</div>`,
        },
        { data: "product_name", title: t("reservations.table.product", "Product"), defaultContent: "-" },
        { data: "city_name", title: t("reservations.table.city", "City"), defaultContent: "-" },
        { data: "quantity", title: t("reservations.table.quantity", "Quantity"), defaultContent: 0 },
        { data: null, title: t("reservations.table.source", "Source"), render: (value, type, row) => formatSource(row) },
        { data: "status", title: t("reservations.table.status", "Status"), render: (value) => `<span class="badge text-bg-${STATUS_BADGES[value] || "secondary"}">${statusLabels[value] || value || "-"}</span>` },
        { data: "reserved_at", title: t("reservations.table.date", "Date"), render: (value) => formatDate(value) },
        { data: null, title: t("reservations.table.actions", "Actions"), orderable: false, searchable: false, className: "text-end", render: (value, type, row) => `<button class="btn btn-sm btn-outline-primary js-show" data-id="${row.id}"><i class="bi bi-eye me-1"></i>${t("reservations.actions.view", "View")}</button>` },
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
  }, [DT_LANG_URL, loading, items, statusLabels, t]);

  useEffect(() => {
    const tableNode = itemsTableRef.current;
    const reservationItems = Array.isArray(selected?.items) ? selected.items : [];

    if (!showOpen || showLoading || !selected || !tableNode || reservationItems.length === 0) {
      if (itemsDtRef.current) {
        try {
          itemsDtRef.current.clear();
          itemsDtRef.current.destroy();
        } catch {}
        itemsDtRef.current = null;
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

    itemsDtRef.current = $table.DataTable({
      data: reservationItems,
      pageLength: 5,
      lengthMenu: [5, 10, 25, 50],
      ordering: true,
      searching: true,
      responsive: true,
      language: { url: DT_LANG_URL },
      columns: [
        { data: "product_name", title: t("reservations.items.product", "Product"), defaultContent: "-" },
        { data: "city_name", title: t("reservations.items.city", "City"), defaultContent: "-" },
        { data: "product_price", title: t("reservations.items.price", "Price"), render: (value) => `<span class="text-primary fw-bold">${formatPrice(value)}</span>` },
        { data: "quantity", title: t("reservations.items.quantity", "Quantity"), defaultContent: 0 },
      ],
    });

    return () => {
      try {
        if (itemsDtRef.current) {
          itemsDtRef.current.clear();
          itemsDtRef.current.destroy();
        }
      } catch {}
      itemsDtRef.current = null;
      if (tableNode.tBodies?.[0]) tableNode.tBodies[0].innerHTML = "";
    };
  }, [DT_LANG_URL, selected, showLoading, showOpen, t]);

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">{t("reservations.title", "Reservation tracking")}</h4>
          <div className="text-muted small">{t("reservations.subtitle", "History of reserved, released and consumed products.")}</div>
          <div className="text-muted small">{t("reservations.total", "Total")}: {items.length}</div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => load({ mode: "refresh" })} disabled={loading || refreshing}>
            {loading || refreshing ? <><span className="spinner-border spinner-border-sm me-2" />{t("reservations.refreshing", "Refreshing...")}</> : <><i className="bi bi-arrow-clockwise me-2" />{t("reservations.refresh", "Refresh")}</>}
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {error ? <div className="alert alert-danger">{error}</div> : null}
          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted"><span className="spinner-border spinner-border-sm" />{t("reservations.loading", "Loading...")}</div>
          ) : items.length === 0 ? (
            <div className="text-center text-muted py-4">{t("reservations.empty", "No reservations found.")}</div>
          ) : (
            <div className="table-responsive">
              <table ref={tableRef} className="table align-middle mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th style={{ width: 70 }}>#</th><th>{t("reservations.table.customer", "Customer")}</th><th>{t("reservations.table.product", "Product")}</th><th>{t("reservations.table.city", "City")}</th><th>{t("reservations.table.quantity", "Quantity")}</th><th>{t("reservations.table.source", "Source")}</th><th>{t("reservations.table.status", "Status")}</th><th>{t("reservations.table.date", "Date")}</th><th className="text-end" style={{ width: 140 }}>{t("reservations.table.actions", "Actions")}</th>
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
                  <h5 className="modal-title text-warning">{t("reservations.show.title", "Reservation details")}</h5>
                  <button type="button" className="btn-close" onClick={closeShow} disabled={showLoading} />
                </div>

                <div className="modal-body">
                  {showLoading ? (
                    <div className="d-flex align-items-center gap-2 text-muted"><span className="spinner-border spinner-border-sm" />{t("reservations.show.loading", "Loading details...")}</div>
                  ) : selected ? (
                    <div className="row g-3">
                      <div className="col-12 col-lg-6">
                        <div className="border rounded-3 p-3 h-100">
                          <div className="text-muted small mb-1">{t("reservations.show.customer", "Customer")}</div>
                          <div className="fw-semibold">{selected.user_name || "-"}</div>
                          <div className="small text-primary">{selected.user_email || "-"}</div>
                          <hr />
                          <div className="text-muted small mb-1">{t("reservations.show.product", "Product")}</div>
                          <div>{selected.product_name || "-"}</div>
                          <hr />
                          <div className="text-muted small mb-1">{t("reservations.show.city", "City")}</div>
                          <div>{selected.city_name || "-"}</div>
                          <hr />
                          <div className="text-muted small mb-1">{t("reservations.show.quantity", "Quantity")}</div>
                          <div>{selected.quantity}</div>
                        </div>
                      </div>

                      <div className="col-12 col-lg-6">
                        <div className="border rounded-3 p-3 h-100">
                          <div className="text-muted small mb-1">{t("reservations.show.status", "Status")}</div>
                          <div className="mb-3"><span className={`badge text-bg-${STATUS_BADGES[selected.status] || "secondary"}`}>{statusLabels[selected.status] || selected.status}</span></div>
                          <div className="text-muted small mb-1">{t("reservations.show.source", "Source")}</div>
                          <div className="mb-3">{formatSource(selected)}</div>
                          <div className="text-muted small mb-1">{t("reservations.show.expiresAt", "Expires at")}</div><div className="mb-3">{formatDate(selected.expires_at)}</div>
                          <div className="text-muted small mb-1">{t("reservations.show.reservedAt", "Reserved at")}</div><div className="mb-3">{formatDate(selected.reserved_at)}</div>
                          <div className="text-muted small mb-1">{t("reservations.show.releasedAt", "Released at")}</div><div className="mb-3">{formatDate(selected.released_at)}</div>
                          <div className="text-muted small mb-1">{t("reservations.show.consumedAt", "Consumed at")}</div><div className="mb-3">{formatDate(selected.consumed_at)}</div>
                          <div className="text-muted small mb-1">{t("reservations.show.reason", "Reason")}</div><div>{selected.release_reason || "-"}</div>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="border rounded-3 p-3">
                          <div className="text-muted small mb-2">{t("reservations.items.title", "Reservation items")}</div>
                          {Array.isArray(selected.items) && selected.items.length > 0 ? (
                            <div className="table-responsive">
                              <table ref={itemsTableRef} className="table align-middle mb-0">
                                <thead>
                                  <tr className="text-muted small">
                                    <th>{t("reservations.items.product", "Product")}</th><th>{t("reservations.items.city", "City")}</th><th>{t("reservations.items.price", "Price")}</th><th>{t("reservations.items.quantity", "Quantity")}</th>
                                  </tr>
                                </thead>
                                <tbody />
                              </table>
                            </div>
                          ) : (
                            <div className="text-muted">{t("reservations.items.empty", "No items available.")}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted">{t("reservations.show.empty", "No details available.")}</div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeShow} disabled={showLoading}>{t("reservations.actions.close", "Close")}</button>
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
