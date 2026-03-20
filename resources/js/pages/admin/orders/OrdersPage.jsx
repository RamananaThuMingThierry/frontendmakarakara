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

const STATUS_LABELS = {
  pending: "En attente",
  confirmed: "Confirmee",
  processing: "En traitement",
  delivered: "Livree",
  cancelled: "Annulee",
};

const PAYMENT_STATUS_BADGES = {
  unpaid: "secondary",
  pending_verification: "warning",
  paid: "success",
  refunded: "dark",
};

const PAYMENT_STATUS_LABELS = {
  unpaid: "Non payee",
  pending_verification: "Verification",
  paid: "Payee",
  refunded: "Remboursee",
};

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("fr-FR");
  } catch {
    return value;
  }
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MGA`;
}

function getGoogleMapsUrl(address) {
  const latitude = address?.latitude;
  const longitude = address?.longitude;

  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return "";
  }

  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export default function OrdersPage() {
  const { lang } = useI18n();
  const DT_LANG_URL = useMemo(() => `/lang/datatables/${lang}.json`, [lang]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [showOpen, setShowOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

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
      setError(e?.response?.data?.message || "Impossible de charger les commandes.");
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
      const data = await adminOrdersApi.show(item.encrypted_id || item.id);
      setSelected(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Impossible de charger le detail de la commande.");
      setShowOpen(false);
    } finally {
      setShowLoading(false);
    }
  }

  function closeShow() {
    if (showLoading || actionLoading) return;
    setShowOpen(false);
    setSelected(null);
  }

  async function runAction(actionName, request) {
    if (!selected?.encrypted_id || actionLoading) return;

    setError("");
    setActionLoading(actionName);
    try {
      const data = await request(selected.encrypted_id);
      setSelected(data);
      setItems((current) => current.map((item) => (item.id === data.id ? data : item)));
      await load({ mode: "refresh" });
    } catch (e) {
      const message =
        e?.response?.data?.errors
          ? Object.values(e.response.data.errors).flat().join(" ")
          : e?.response?.data?.message;
      setError(message || "Action impossible sur cette commande.");
    } finally {
      setActionLoading("");
    }
  }

  function canConfirm(order) {
    return order?.status === "pending";
  }

  function canProcess(order) {
    return order?.status === "confirmed";
  }

  function canMarkPaid(order) {
    return order?.status !== "cancelled" && order?.payment_status !== "paid";
  }

  function canDeliver(order) {
    return order?.status === "confirmed" || order?.status === "processing";
  }

  function canCancel(order) {
    return order?.status === "pending" || order?.status === "confirmed" || order?.status === "processing";
  }

  function canSendReceipt(order) {
    return order?.payment_status === "paid" && !order?.receipt?.sent_at;
  }

  useEffect(() => {
    const tableNode = tableRef.current;
    if (loading || !tableNode) return;

    const $table = $(tableNode);

    try {
      $table.off("click", ".js-show");
    } catch {}

    try {
      if ($.fn.dataTable.isDataTable(tableNode)) {
        const existing = $table.DataTable();
        existing.clear();
        existing.destroy();
      }
    } catch {}

    if (tableNode.tBodies?.[0]) {
      tableNode.tBodies[0].innerHTML = "";
    }

    dtRef.current = $table.DataTable({
      data: [],
      pageLength: 10,
      lengthMenu: [10, 15, 25, 50, 100],
      ordering: true,
      searching: true,
      responsive: true,
      language: { url: DT_LANG_URL },
      columns: [
        { data: null, title: "#", render: (d, t, row, meta) => meta.row + 1 },
        { data: "order_number", title: "Commande", defaultContent: "-" },
        {
          data: null,
          title: "Client",
          render: (value, type, row) => `
            <div class="fw-semibold">${row.user_name || "-"}</div>
            <div class="small text-muted">${row.user_email || "-"}</div>
          `,
        },
        { data: "items_count", title: "Articles", defaultContent: 0 },
        { data: "quantity", title: "Quantite", defaultContent: 0 },
        {
          data: "status",
          title: "Commande",
          render: (value) => `<span class="badge text-bg-${STATUS_BADGES[value] || "secondary"}">${STATUS_LABELS[value] || value || "-"}</span>`,
        },
        {
          data: "payment_status",
          title: "Paiement",
          render: (value) => `<span class="badge text-bg-${PAYMENT_STATUS_BADGES[value] || "secondary"}">${PAYMENT_STATUS_LABELS[value] || value || "-"}</span>`,
        },
        { data: "total", title: "Total", render: (value) => formatPrice(value) },
        { data: "created_at", title: "Date", render: (value) => formatDate(value) },
        {
          data: null,
          title: "Actions",
          orderable: false,
          searchable: false,
          className: "text-end",
          render: (value, type, row) => `
            <button class="btn btn-sm btn-outline-primary js-show" data-id="${row.id}">
              <i class="bi bi-eye me-1"></i>
              Voir
            </button>
          `,
        },
      ],
    });

    $table.on("click", ".js-show", (e) => {
      const id = Number($(e.currentTarget).data("id"));
      const item = itemsRef.current.find((current) => Number(current.id) === id);
      if (item) openShow(item);
    });

    return () => {
      try {
        $table.off("click", ".js-show");
      } catch {}

      try {
        if (dtRef.current) {
          dtRef.current.clear();
          dtRef.current.destroy();
        }
      } catch {}

      dtRef.current = null;
      if (tableNode.tBodies?.[0]) {
        tableNode.tBodies[0].innerHTML = "";
      }
    };
  }, [DT_LANG_URL, loading]);

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

      if (tableNode?.tBodies?.[0]) {
        tableNode.tBodies[0].innerHTML = "";
      }
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

    if (tableNode.tBodies?.[0]) {
      tableNode.tBodies[0].innerHTML = "";
    }

    orderItemsDtRef.current = $table.DataTable({
      data: orderItems,
      pageLength: 5,
      lengthMenu: [5, 10, 25, 50],
      ordering: true,
      searching: true,
      responsive: true,
      language: { url: DT_LANG_URL },
      columns: [
        { data: "product_name", title: "Produit", defaultContent: "-" },
        { data: "sku", title: "SKU", defaultContent: "-" },
        { data: "quantity", title: "Quantite", defaultContent: 0 },
        { data: "unit_price", title: "Prix unitaire", render: (value) => formatPrice(value) },
        { data: "line_total", title: "Total ligne", render: (value) => formatPrice(value) },
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
      if (tableNode.tBodies?.[0]) {
        tableNode.tBodies[0].innerHTML = "";
      }
    };
  }, [DT_LANG_URL, selected, showLoading, showOpen]);

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">Gestion des commandes</h4>
          <div className="text-muted small">Suivi des commandes clients et consultation des order_items.</div>
          <div className="text-muted small">Total: {items.length}</div>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => load({ mode: "refresh" })}
            disabled={loading || refreshing}
          >
            {loading || refreshing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Actualisation...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2" />
                Actualiser
              </>
            )}
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {error ? <div className="alert alert-danger">{error}</div> : null}

          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <span className="spinner-border spinner-border-sm" />
              Chargement...
            </div>
          ) : (
            <div className="table-responsive">
              <table ref={tableRef} className="table align-middle mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th>#</th>
                    <th>Commande</th>
                    <th>Client</th>
                    <th>Articles</th>
                    <th>Quantite</th>
                    <th>Statut</th>
                    <th>Paiement</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th className="text-end">Actions</th>
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
                  <h5 className="modal-title text-warning">Detail de la commande</h5>
                  <button type="button" className="btn-close" onClick={closeShow} disabled={showLoading} />
                </div>

                <div className="modal-body">
                  {showLoading ? (
                    <div className="d-flex align-items-center gap-2 text-muted">
                      <span className="spinner-border spinner-border-sm" />
                      Chargement du detail...
                    </div>
                  ) : selected ? (
                    <div className="row g-3">
                      <div className="col-12 col-lg-6">
                        <div className="border rounded-3 p-3 h-100">
                          <div className="text-muted small mb-1">Commande</div>
                          <div className="fw-semibold">{selected.order_number || "-"}</div>

                          <hr />

                          <div className="text-muted small mb-1">Client</div>
                          <div>{selected.user_name || "-"}</div>
                          <div className="small text-primary">{selected.user_email || "-"}</div>

                          <hr />

                          <div className="text-muted small mb-1">Adresse</div>
                          <div>{selected.address?.full_name || "-"}</div>
                          <div>{selected.address?.phone || "-"}</div>
                          <div>{[selected.address?.address_line1, selected.address?.address_line2, selected.address?.city_name, selected.address?.region].filter(Boolean).join(", ") || "-"}</div>
                          {selected.address?.latitude && selected.address?.longitude ? (
                            <div className="mt-2">
                              <div className="small text-muted">
                                GPS: {selected.address.latitude}, {selected.address.longitude}
                              </div>
                              <a
                                href={getGoogleMapsUrl(selected.address)}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm btn-outline-dark mt-2"
                              >
                                <i className="bi bi-map me-2" />
                                Ouvrir dans Google Maps
                              </a>
                            </div>
                          ) : null}

                          <hr />

                          <div className="text-muted small mb-1">Notes</div>
                          <div>{selected.notes || "-"}</div>
                        </div>
                      </div>

                      <div className="col-12 col-lg-6">
                        <div className="border rounded-3 p-3 h-100">
                          <div className="text-muted small mb-1">Statut commande</div>
                          <div className="mb-3">
                            <span className={`badge text-bg-${STATUS_BADGES[selected.status] || "secondary"}`}>
                              {STATUS_LABELS[selected.status] || selected.status}
                            </span>
                          </div>

                          <div className="text-muted small mb-1">Statut paiement</div>
                          <div className="mb-3">
                            <span className={`badge text-bg-${PAYMENT_STATUS_BADGES[selected.payment_status] || "secondary"}`}>
                              {PAYMENT_STATUS_LABELS[selected.payment_status] || selected.payment_status}
                            </span>
                          </div>

                          <div className="text-muted small mb-1">Moyen de paiement</div>
                          <div className="mb-3">{selected.payment_method || "-"}</div>

                          <div className="text-muted small mb-1">Facture</div>
                          <div className="mb-3">{selected.invoice?.number || "-"}</div>

                          <div className="text-muted small mb-1">Recu</div>
                          <div className="mb-3">{selected.receipt?.number || "-"}</div>

                          <div className="text-muted small mb-1">Recu envoye le</div>
                          <div className="mb-3">{formatDate(selected.receipt?.sent_at)}</div>

                          <div className="text-muted small mb-1">Total</div>
                          <div className="fw-bold text-danger">{formatPrice(selected.total)}</div>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="border rounded-3 p-3">
                          <div className="text-muted small mb-2">Order items</div>
                          {Array.isArray(selected.items) && selected.items.length > 0 ? (
                            <div className="table-responsive">
                              <table ref={orderItemsTableRef} className="table align-middle mb-0">
                                <thead>
                                  <tr className="text-muted small">
                                    <th>Produit</th>
                                    <th>SKU</th>
                                    <th>Quantite</th>
                                    <th>Prix unitaire</th>
                                    <th>Total ligne</th>
                                  </tr>
                                </thead>
                                <tbody />
                              </table>
                            </div>
                          ) : (
                            <div className="text-muted">Aucun item disponible.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted">Aucun detail disponible.</div>
                  )}
                </div>

                <div className="modal-footer">
                  <div className="d-flex flex-wrap gap-2 me-auto">
                    <button
                      type="button"
                      className="btn btn-outline-info"
                      disabled={!canConfirm(selected) || !!actionLoading}
                      onClick={() => runAction("confirm", adminOrdersApi.confirm)}
                    >
                      {actionLoading === "confirm" ? "..." : "Confirmer"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      disabled={!canProcess(selected) || !!actionLoading}
                      onClick={() => runAction("processing", adminOrdersApi.startProcessing)}
                    >
                      {actionLoading === "processing" ? "..." : "Mettre en traitement"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-success"
                      disabled={!canMarkPaid(selected) || !!actionLoading}
                      onClick={() => runAction("paid", adminOrdersApi.markAsPaid)}
                    >
                      {actionLoading === "paid" ? "..." : "Marquer payee"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-dark"
                      disabled={!canSendReceipt(selected) || !!actionLoading}
                      onClick={() => runAction("receipt", adminOrdersApi.sendReceipt)}
                    >
                      {actionLoading === "receipt" ? "..." : "Envoyer recu"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-success"
                      disabled={!canDeliver(selected) || !!actionLoading}
                      onClick={() => runAction("deliver", adminOrdersApi.markAsDelivered)}
                    >
                      {actionLoading === "deliver" ? "..." : "Livrer"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      disabled={!canCancel(selected) || !!actionLoading}
                      onClick={() => runAction("cancel", adminOrdersApi.cancel)}
                    >
                      {actionLoading === "cancel" ? "..." : "Annuler"}
                    </button>
                  </div>
                  <button type="button" className="btn btn-outline-secondary" onClick={closeShow} disabled={showLoading}>
                    Fermer
                  </button>
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
