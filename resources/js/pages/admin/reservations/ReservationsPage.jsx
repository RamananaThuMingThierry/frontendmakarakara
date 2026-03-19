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

const STATUS_LABELS = {
  active: "Active",
  released: "Liberee",
  consumed: "Consommee",
};

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("fr-FR");
  } catch {
    return value;
  }
}

function formatSource(item) {
  if (item.order_id || item.reference_type?.includes("Order")) return "Commande";
  if (item.cart_id || item.reference_type?.includes("Cart")) return "Panier";
  return "Reservation";
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "-";
  return `${Number(value).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Ar`;
}

export default function ReservationsPage() {
  const { lang } = useI18n();
  const DT_LANG_URL = useMemo(() => `/lang/datatables/${lang}.json`, [lang]);

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
      setError(e?.response?.data?.message || "Impossible de charger les reservations.");
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
      setError(e?.response?.data?.message || "Impossible de charger le detail de la reservation.");
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
      data: items,
      pageLength: 10,
      lengthMenu: [10, 15, 25, 50, 100],
      ordering: true,
      searching: true,
      responsive: true,
      language: { url: DT_LANG_URL },
      columns: [
        {
          data: null,
          title: "#",
          render: (d, t, row, meta) => meta.row + 1,
        },
        {
          data: null,
          title: "Client",
          render: (value, type, row) => `
            <div class="fw-semibold">${row.user_name || "-"}</div>
            <div class="small text-muted">${row.user_email || "-"}</div>
          `,
        },
        { data: "product_name", title: "Produit", defaultContent: "-" },
        { data: "city_name", title: "Ville", defaultContent: "-" },
        { data: "quantity", title: "Quantite", defaultContent: 0 },
        {
          data: null,
          title: "Source",
          render: (value, type, row) => formatSource(row),
        },
        {
          data: "status",
          title: "Statut",
          render: (value) =>
            `<span class="badge text-bg-${STATUS_BADGES[value] || "secondary"}">${STATUS_LABELS[value] || value || "-"}</span>`,
        },
        {
          data: "reserved_at",
          title: "Date",
          render: (value) => formatDate(value),
        },
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

    itemsDtRef.current = $table.DataTable({
      data: reservationItems,
      pageLength: 5,
      lengthMenu: [5, 10, 25, 50],
      ordering: true,
      searching: true,
      responsive: true,
      language: { url: DT_LANG_URL },
      columns: [
        { data: "product_name", title: "Produit", defaultContent: "-" },
        { data: "city_name", title: "Ville", defaultContent: "-" },
        {
          data: "product_price",
          title: "Prix",
          render: (value) => {
            return `<span class="text-primary fw-bold">${formatPrice(value)}</span>`;
          },
        },
        { data: "quantity", title: "Quantite", defaultContent: 0 },
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
      if (tableNode.tBodies?.[0]) {
        tableNode.tBodies[0].innerHTML = "";
      }
    };
  }, [DT_LANG_URL, selected, showLoading, showOpen]);

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">Suivi des reservations</h4>
          <div className="text-muted small">Historique des produits reserves, liberes et consommes.</div>
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
                    <th style={{ width: 70 }}>#</th>
                    <th>Client</th>
                    <th>Produit</th>
                    <th>Ville</th>
                    <th>Quantite</th>
                    <th>Source</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th className="text-end" style={{ width: 140 }}>Actions</th>
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
                  <h5 className="modal-title text-warning">Detail de la reservation</h5>
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
                          <div className="text-muted small mb-1">Client</div>
                          <div className="fw-semibold">{selected.user_name || "-"}</div>
                          <div className="small text-primary">{selected.user_email || "-"}</div>

                          <hr />

                          <div className="text-muted small mb-1">Produit</div>
                          <div>{selected.product_name || "-"}</div>

                          <hr />

                          <div className="text-muted small mb-1">Ville</div>
                          <div>{selected.city_name || "-"}</div>

                          <hr />

                          <div className="text-muted small mb-1">Quantite</div>
                          <div>{selected.quantity}</div>
                        </div>
                      </div>

                      <div className="col-12 col-lg-6">
                        <div className="border rounded-3 p-3 h-100">
                          <div className="text-muted small mb-1">Statut</div>
                          <div className="mb-3">
                            <span className={`badge text-bg-${STATUS_BADGES[selected.status] || "secondary"}`}>
                              {STATUS_LABELS[selected.status] || selected.status}
                            </span>
                          </div>

                          <div className="text-muted small mb-1">Source</div>
                          <div className="mb-3">{formatSource(selected)}</div>

                          <div className="text-muted small mb-1">Expire le</div>
                          <div className="mb-3">{formatDate(selected.expires_at)}</div>

                          <div className="text-muted small mb-1">Reserve le</div>
                          <div className="mb-3">{formatDate(selected.reserved_at)}</div>

                          <div className="text-muted small mb-1">Libere le</div>
                          <div className="mb-3">{formatDate(selected.released_at)}</div>

                          <div className="text-muted small mb-1">Consomme le</div>
                          <div className="mb-3">{formatDate(selected.consumed_at)}</div>

                          <div className="text-muted small mb-1">Motif</div>
                          <div>{selected.release_reason || "-"}</div>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="border rounded-3 p-3">
                          <div className="text-muted small mb-2">Items de la reservation</div>
                          {Array.isArray(selected.items) && selected.items.length > 0 ? (
                            <div className="table-responsive">
                              <table ref={itemsTableRef} className="table align-middle mb-0">
                                <thead>
                                  <tr className="text-muted small">
                                    <th>Produit</th>
                                    <th>Ville</th>
                                    <th>Prix</th>
                                    <th>Quantite</th>
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
