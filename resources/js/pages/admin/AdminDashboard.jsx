import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminDashboard } from "../../api/admin_dashboard";

function formatPriceMGA(value) {
  return `${Number(value || 0).toLocaleString("fr-FR")} MGA`;
}

function formatDate(value, options = {}) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR", options);
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("fr-FR");
}

const ORDER_STATUS_LABELS = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En traitement",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const PAYMENT_STATUS_LABELS = {
  unpaid: "Non payée",
  pending_verification: "Vérification",
  paid: "Payée",
  refunded: "Remboursée",
};

function statusBadgeClass(status) {
  const map = {
    pending: "warning",
    confirmed: "info",
    processing: "primary",
    delivered: "success",
    cancelled: "danger",
    unpaid: "secondary",
    pending_verification: "warning",
    paid: "success",
    refunded: "dark",
  };

  return `text-bg-${map[status] || "secondary"}`;
}

function StatCard({ title, value, hint, icon, tone = "warning" }) {
  return (
    <div className="col-12 col-md-6 col-xl-3">
      <div className="bg-white rounded-4 shadow-sm p-3 h-100 border">
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div>
            <div className="text-secondary small">{title}</div>
            <div className="fw-bold fs-4">{value}</div>
            {hint ? <div className="small text-secondary mt-1">{hint}</div> : null}
          </div>
          <div className={`fs-3 text-${tone}`}>
            <i className={`bi ${icon}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LineChartCard({ data, granularity }) {
  const chartData = data.length ? data : [];
  const maxRevenue = Math.max(...chartData.map((item) => Number(item.revenue_total || 0)), 1);
  const maxOrders = Math.max(...chartData.map((item) => Number(item.orders_count || 0)), 1);
  const tickIndexes =
    granularity === "hourly"
      ? chartData.map((_, index) => index).filter((index) => index % 3 === 0)
      : chartData.map((_, index) => index);

  const pointsRevenue = chartData
    .map((item, index) => {
      const x = chartData.length === 1 ? 50 : (index / (chartData.length - 1)) * 100;
      const y = 90 - (Number(item.revenue_total || 0) / maxRevenue) * 80;
      return `${x},${y}`;
    })
    .join(" ");

  const pointsOrders = chartData
    .map((item, index) => {
      const x = chartData.length === 1 ? 50 : (index / (chartData.length - 1)) * 100;
      const y = 90 - (Number(item.orders_count || 0) / maxOrders) * 80;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="bg-white rounded-4 shadow-sm p-4 border h-100">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <div className="fw-semibold">Évolution visuelle</div>
          <div className="small text-secondary">
            {granularity === "hourly"
              ? "CA encaissé et volume de commandes par heure."
              : "CA encaissé et volume de commandes par jour."}
          </div>
        </div>
        <div className="d-flex gap-3 small">
          <span className="d-inline-flex align-items-center gap-2">
            <span className="rounded-circle bg-warning" style={{ width: 10, height: 10 }} />
            CA
          </span>
          <span className="d-inline-flex align-items-center gap-2">
            <span className="rounded-circle bg-primary" style={{ width: 10, height: 10 }} />
            Commandes
          </span>
        </div>
      </div>

      {chartData.length ? (
        <>
          <div className="row g-3">
            <div className="col-12 col-lg-9">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: 300 }}>
                <line x1="8" y1="90" x2="100" y2="90" stroke="#d1d5db" strokeWidth="0.5" />
                <line x1="8" y1="10" x2="8" y2="90" stroke="#d1d5db" strokeWidth="0.5" />
                <line x1="8" y1="70" x2="100" y2="70" stroke="#e5e7eb" strokeWidth="0.4" />
                <line x1="8" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.4" />
                <line x1="8" y1="30" x2="100" y2="30" stroke="#e5e7eb" strokeWidth="0.4" />
                <line x1="8" y1="10" x2="100" y2="10" stroke="#e5e7eb" strokeWidth="0.4" />

                {[90, 70, 50, 30, 10].map((y) => (
                  <text key={y} x="0" y={y + 1} fontSize="3.5" fill="#6b7280">
                    {Math.round(((90 - y) / 80) * maxRevenue).toLocaleString("fr-FR")}
                  </text>
                ))}

                <polyline fill="none" stroke="#f0ad00" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" points={pointsRevenue} />
                <polyline fill="none" stroke="#0d6efd" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" points={pointsOrders} />

                {chartData.map((item, index) => {
                  const x = chartData.length === 1 ? 50 : (index / (chartData.length - 1)) * 100;
                  const revenueY = 90 - (Number(item.revenue_total || 0) / maxRevenue) * 80;
                  const ordersY = 90 - (Number(item.orders_count || 0) / maxOrders) * 80;

                  return (
                    <g key={item.bucket}>
                      <circle cx={x} cy={revenueY} r="1.1" fill="#f0ad00" />
                      <circle cx={x} cy={ordersY} r="1" fill="#0d6efd" />
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="col-12 col-lg-3">
              <div className="border rounded-4 p-3 h-100 bg-light-subtle">
                <div className="small text-secondary mb-2">Repères</div>
                <div className="fw-semibold">{granularity === "hourly" ? "Vue horaire" : "Vue journalière"}</div>
                <div className="small text-secondary mt-2">
                  Max CA: {formatPriceMGA(maxRevenue)}
                </div>
                <div className="small text-secondary">
                  Max commandes: {Number(maxOrders || 0).toLocaleString("fr-FR")}
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between gap-2 small text-secondary mt-3 flex-wrap">
            {chartData.map((item, index) =>
              tickIndexes.includes(index) ? <span key={item.bucket}>{item.label}</span> : <span key={item.bucket} />
            )}
          </div>
        </>
      ) : (
        <div className="text-secondary">Aucune donnée sur cette période.</div>
      )}
    </div>
  );
}

function BarChartCard({ title, data, labels }) {
  const maxValue = Math.max(...data.map((item) => Number(item.count || 0)), 1);

  return (
    <div className="bg-white rounded-4 shadow-sm p-4 border h-100">
      <div className="fw-semibold mb-3">{title}</div>
      <div className="d-flex flex-column gap-3">
        {data.length ? (
          data.map((item) => (
            <div key={item.key}>
              <div className="d-flex align-items-center justify-content-between small mb-1">
                <span>{labels[item.key] || item.key}</span>
                <strong>{item.count}</strong>
              </div>
              <div className="progress" style={{ height: 10 }}>
                <div className="progress-bar bg-warning" style={{ width: `${(Number(item.count || 0) / maxValue) * 100}%` }} />
              </div>
            </div>
          ))
        ) : (
          <div className="text-secondary">Aucune donnée disponible.</div>
        )}
      </div>
    </div>
  );
}

function TopProductsBarChart({ title, data }) {
  const maxValue = Math.max(...data.map((item) => Number(item.revenue_total || 0)), 1);

  return (
    <div className="bg-white rounded-4 shadow-sm p-4 border h-100">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="fw-semibold">{title}</div>
        <span className="small text-secondary">Par chiffre d'affaires</span>
      </div>

      {data.length ? (
        <div className="d-flex flex-column gap-3">
          {data.map((item) => (
            <div key={item.product_id || item.sku}>
              <div className="d-flex align-items-center justify-content-between mb-1 gap-3 border-bottom">
                <div>
                  <div className="fw-semibold">{item.product_name}</div>
                  <div className="small text-secondary">{item.quantity_sold} ventes</div>
                </div>
                <div className="small fw-semibold text-primary">{formatPriceMGA(item.revenue_total)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-secondary">Aucune vente sur cette période.</div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [filters, setFilters] = useState({
    mode: "daily",
    start_date: "",
    end_date: "",
    month: "",
  });
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const data = await getAdminDashboard({
          mode: filters.mode,
          start_date: filters.mode === "daily" ? filters.start_date || undefined : undefined,
          end_date: filters.mode === "daily" ? filters.end_date || undefined : undefined,
          month: filters.mode === "monthly" ? filters.month || undefined : undefined,
        });

        if (!cancelled) {
          setDashboard(data);

          if (!filters.start_date || !filters.end_date) {
            setFilters((prev) => ({
              ...prev,
              start_date: prev.start_date || data?.filters?.start_date || "",
              end_date: prev.end_date || data?.filters?.end_date || "",
              month: prev.month || data?.filters?.month || "",
            }));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || "Impossible de charger le dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [filters.mode, filters.start_date, filters.end_date, filters.month]);

  const summary = dashboard?.summary || {};
  const series = dashboard?.series || [];
  const statusBreakdown = dashboard?.status_breakdown || [];
  const paymentBreakdown = dashboard?.payment_breakdown || [];
  const topProducts = dashboard?.top_products || [];
  const recentOrders = dashboard?.recent_orders || [];
  const recentActivity = dashboard?.recent_activity || [];
  const seriesGranularity = dashboard?.filters?.series_granularity || "daily";

  const periodLabel = useMemo(() => {
    if (!dashboard?.filters) return "";
    const modeLabel = dashboard.filters.mode === "monthly" ? "Mensuel" : "Journalier";
    return `${modeLabel} du ${formatDate(dashboard.filters.start_date)} au ${formatDate(dashboard.filters.end_date)}`;
  }, [dashboard]);

  return (
    <div className="d-flex flex-column gap-4">
      <div className="bg-white rounded-4 shadow-sm p-4 border">
        <div className="d-flex flex-column flex-xl-row justify-content-between gap-3">
          <div>
            <h1 className="fw-bold mb-1">Dashboard </h1>
          </div>

          <div className="d-flex flex-column flex-md-row gap-2">
            <div className="btn-group" role="group" aria-label="Période dashboard">
              <button
                type="button"
                className={`btn ${filters.mode === "daily" ? "btn-warning" : "btn-outline-warning"}`}
                onClick={() => setFilters((prev) => ({ ...prev, mode: "daily" }))}
              >
                Journalier
              </button>
              <button
                type="button"
                className={`btn ${filters.mode === "monthly" ? "btn-warning" : "btn-outline-warning"}`}
                onClick={() => setFilters((prev) => ({ ...prev, mode: "monthly", month: prev.month || dashboard?.filters?.month || "" }))}
              >
                Mensuel
              </button>
            </div>

            {filters.mode === "daily" ? (
              <>
                <input
                  type="date"
                  className="form-control"
                  value={filters.start_date}
                  onChange={(e) => setFilters((prev) => ({ ...prev, start_date: e.target.value }))}
                />
                <input
                  type="date"
                  className="form-control"
                  value={filters.end_date}
                  onChange={(e) => setFilters((prev) => ({ ...prev, end_date: e.target.value }))}
                />
              </>
            ) : (
              <input
                type="month"
                className="form-control"
                value={filters.month}
                onChange={(e) => setFilters((prev) => ({ ...prev, month: e.target.value }))}
              />
            )}
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  start_date: "",
                  end_date: "",
                  month: "",
                }))
              }
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      {loading ? (
        <div className="bg-white rounded-4 shadow-sm p-5 text-center border">
          <div className="spinner-border spinner-border-sm me-2" />
          Chargement du dashboard...
        </div>
      ) : null}

      {!loading ? (
        <>
          <div className="row g-3">
            <StatCard
              title="Chiffre d'affaires encaissé"
              value={formatPriceMGA(summary.revenue_total)}
              hint={`${summary.paid_orders_count || 0} commandes payées`}
              icon="bi-cash-coin"
            />
            <StatCard
              title="Commandes sur la période"
              value={Number(summary.orders_count || 0).toLocaleString("fr-FR")}
              hint={`${summary.cancelled_orders_count || 0} annulées`}
              icon="bi-receipt"
              tone="primary"
            />
            <StatCard
              title="Panier moyen"
              value={formatPriceMGA(summary.average_order_value)}
              hint={`${summary.completed_orders_count || 0} commandes actives`}
              icon="bi-bag-check"
              tone="success"
            />
            <StatCard
              title="Nouveaux clients"
              value={Number(summary.new_customers_count || 0).toLocaleString("fr-FR")}
              hint={`${summary.customers_total || 0} clients au total`}
              icon="bi-people"
              tone="info"
            />
            <StatCard
              title="Paiements à vérifier"
              value={Number(summary.pending_payments_count || 0).toLocaleString("fr-FR")}
              hint="Mobile money en attente"
              icon="bi-phone"
              tone="danger"
            />
            <StatCard
              title="Commandes en attente"
              value={Number(summary.pending_orders_count || 0).toLocaleString("fr-FR")}
              hint="À confirmer ou traiter"
              icon="bi-hourglass-split"
              tone="warning"
            />
            <StatCard
              title="Réservations actives"
              value={Number(summary.active_reservations_count || 0).toLocaleString("fr-FR")}
              hint="Produits encore bloqués"
              icon="bi-bookmark-check"
              tone="primary"
            />
            <StatCard
              title="Produits actifs"
              value={Number(summary.active_products_count || 0).toLocaleString("fr-FR")}
              hint={`${summary.products_total || 0} produits au catalogue`}
              icon="bi-box-seam"
              tone="success"
            />
          </div>

          <div className="row g-2">
            <div className="col-12">
              <LineChartCard data={series} granularity={seriesGranularity} />
            </div>

            <div className="col-12">
              <div className="bg-white rounded-4 shadow-sm p-4 border h-100">
                <div className="fw-semibold mb-3">Points d’attention admin</div>
                <div className="row">
                  <div className="col-md-3">
                          <div className="border rounded-4 p-3">
                    <div className="small text-secondary">Paiements à valider</div>
                    <div className="fw-bold fs-5">{summary.pending_payments_count || 0}</div>
                    <Link to="/admin/orders" className="small">
                      Ouvrir les commandes
                    </Link>
                  </div>
                  </div>

                  <div className="col-md-3">
                  <div className="border rounded-4 p-3">
                    <div className="small text-secondary">Commandes en attente</div>
                    <div className="fw-bold fs-5">{summary.pending_orders_count || 0}</div>
                    <Link to="/admin/orders" className="small">
                      Confirmer ou traiter
                    </Link>
                  </div>
                  </div>

                  <div className="col-md-3">
                  <div className="border rounded-4 p-3">
                    <div className="small text-secondary">Réservations actives</div>
                    <div className="fw-bold fs-5">{summary.active_reservations_count || 0}</div>
                    <Link to="/admin/reservations" className="small">
                      Voir les réservations
                    </Link>
                  </div>
                  </div>

                  <div className="col-md-3">
                  <div className="border rounded-4 p-3">
                    <div className="small text-secondary">Catalogue actif</div>
                    <div className="fw-bold fs-5">{summary.active_products_count || 0}</div>
                    <Link to="/admin/categories" className="small">
                      Gérer les produits
                    </Link>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12 col-lg-6">
              <BarChartCard title="Répartition des commandes" data={statusBreakdown} labels={ORDER_STATUS_LABELS} />
            </div>

            <div className="col-12 col-lg-6">
              <BarChartCard title="Répartition des paiements" data={paymentBreakdown} labels={PAYMENT_STATUS_LABELS} />
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12 xl col-xl-6">
              <TopProductsBarChart title="Top produits vendus" data={topProducts} />
            </div>

            <div className="col-12 xl col-xl-6">
              <div className="bg-white rounded-4 shadow-sm p-4 border h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="fw-semibold">Dernières commandes</div>
                  <Link to="/admin/orders" className="small">Voir plus</Link>
                </div>

                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Commande</th>
                        <th>Client</th>
                        <th>Montant</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.length ? (
                        recentOrders.map((order) => (
                          <tr key={order.id}>
                            <td>
                              <div className="fw-semibold">{order.order_number}</div>
                              <div className="small text-secondary">{formatDateTime(order.created_at)}</div>
                            </td>
                            <td>
                              <div>{order.customer_name || "-"}</div>
                              <div className="small text-secondary">{order.customer_email || "-"}</div>
                            </td>
                            <td>{formatPriceMGA(order.total)}</td>
                            <td>
                              <div className="d-flex flex-column gap-1">
                                <span className={`badge ${statusBadgeClass(order.status)}`}>
                                  {ORDER_STATUS_LABELS[order.status] || order.status}
                                </span>
                                <span className={`badge ${statusBadgeClass(order.payment_status)}`}>
                                  {PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center text-secondary py-4">
                            Aucune commande récente.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="small text-secondary mt-3">
                  Affichage des 10 dernières commandes.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-4 shadow-sm p-4 border">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="fw-semibold">Activité récente admin</div>
              <Link to="/admin/activity-logs" className="small">Voir plus</Link>
            </div>

            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Action</th>
                    <th>Utilisateur</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.length ? (
                    recentActivity.map((log) => (
                      <tr key={log.id}>
                        <td>{formatDateTime(log.created_at)}</td>
                        <td>
                          <span className={`badge text-bg-${log.color || "secondary"}`}>
                            {log.action}
                          </span>
                        </td>
                        <td>{log.user_name || "-"}</td>
                        <td>{log.message || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center text-secondary py-4">
                        Aucune activité récente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="small text-secondary mt-3">
              Affichage des 10 dernières activités.
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
