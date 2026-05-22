import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminDashboard } from "../../api/admin_dashboard";
import { useI18n } from "../../hooks/website/I18nContext";

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

function StatCardXL({ title, value, hint, icon, tone = "warning" }) {
  return (
    <div className="col-12">
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

function LineChartCard({ data, granularity, formatPrice, formatCount, t }) {
  const chartData = data.length ? data : [];
  const maxRevenue = Math.max(...chartData.map((item) => Number(item.revenue_total || 0)), 1);
  const maxOrders = Math.max(...chartData.map((item) => Number(item.orders_count || 0)), 1);
  const tickIndexes = granularity === "hourly" ? chartData.map((_, index) => index).filter((index) => index % 3 === 0) : chartData.map((_, index) => index);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const pointsRevenue = chartData.map((item, index) => {
    const x = chartData.length === 1 ? 50 : (index / (chartData.length - 1)) * 100;
    const y = 90 - (Number(item.revenue_total || 0) / maxRevenue) * 80;
    return `${x},${y}`;
  }).join(" ");

  const pointsOrders = chartData.map((item, index) => {
    const x = chartData.length === 1 ? 50 : (index / (chartData.length - 1)) * 100;
    const y = 90 - (Number(item.orders_count || 0) / maxOrders) * 80;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="bg-white rounded-4 shadow-sm p-4 border h-100">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <div className="fw-semibold">{t("dashboard.charts.visual.title", "Visual trends")}</div>
          <div className="small text-secondary">{granularity === "hourly" ? t("dashboard.charts.visual.hourly", "Collected revenue and order volume by hour.") : t("dashboard.charts.visual.daily", "Collected revenue and order volume by day.")}</div>
        </div>
        <div className="d-flex gap-3 small">
          <span className="d-inline-flex align-items-center gap-2"><span className="rounded-circle bg-warning" style={{ width: 10, height: 10 }} />{t("dashboard.common.revenueShort", "Revenue")}</span>
          <span className="d-inline-flex align-items-center gap-2"><span className="rounded-circle bg-primary" style={{ width: 10, height: 10 }} />{t("dashboard.common.ordersShort", "Orders")}</span>
        </div>
      </div>

      {chartData.length ? (
        <>
          <div className="row g-3">
            <div className="col-12 col-lg-9">
              <div className="position-relative">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: 300 }}>
                  <line x1="8" y1="90" x2="100" y2="90" stroke="#d1d5db" strokeWidth="0.5" />
                  <line x1="8" y1="10" x2="8" y2="90" stroke="#d1d5db" strokeWidth="0.5" />
                  <line x1="8" y1="70" x2="100" y2="70" stroke="#e5e7eb" strokeWidth="0.4" />
                  <line x1="8" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.4" />
                  <line x1="8" y1="30" x2="100" y2="30" stroke="#e5e7eb" strokeWidth="0.4" />
                  <line x1="8" y1="10" x2="100" y2="10" stroke="#e5e7eb" strokeWidth="0.4" />
                  {[90, 70, 50, 30, 10].map((y) => <text key={y} x="0" y={y + 1} fontSize="3.5" fill="#6b7280">{formatCount(Math.round(((90 - y) / 80) * maxRevenue))}</text>)}
                  <polyline fill="none" stroke="#f0ad00" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" points={pointsRevenue} />
                  <polyline fill="none" stroke="#0d6efd" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" points={pointsOrders} />
                  {chartData.map((item, index) => {
                    const x = chartData.length === 1 ? 50 : (index / (chartData.length - 1)) * 100;
                    const revenueY = 90 - (Number(item.revenue_total || 0) / maxRevenue) * 80;
                    const ordersY = 90 - (Number(item.orders_count || 0) / maxOrders) * 80;
                    return <g key={item.bucket}><circle cx={x} cy={revenueY} r="1.1" fill="#f0ad00" /><circle cx={x} cy={ordersY} r="1" fill="#0d6efd" /><circle cx={x} cy={Math.min(revenueY, ordersY)} r="3.2" fill="transparent" style={{ cursor: "pointer" }} onMouseEnter={() => setHoveredPoint(item)} onMouseLeave={() => setHoveredPoint(null)} /></g>;
                  })}
                </svg>
                {hoveredPoint ? <div className="position-absolute top-0 end-0 bg-white border rounded-3 shadow-sm p-3" style={{ minWidth: 220 }}><div className="fw-semibold mb-1">{hoveredPoint.label}</div><div className="small text-secondary">{granularity === "hourly" ? t("dashboard.charts.visual.hourDetail", "Hourly detail") : t("dashboard.charts.visual.periodDetail", "Period detail")}</div><div className="small mt-2"><span className="text-warning fw-semibold">{t("dashboard.common.revenueShort", "Revenue")}:</span> {formatPrice(hoveredPoint.revenue_total)}</div><div className="small"><span className="text-primary fw-semibold">{t("dashboard.common.ordersShort", "Orders")}:</span> {formatCount(hoveredPoint.orders_count || 0)}</div></div> : null}
              </div>
            </div>
            <div className="col-12 col-lg-3"><div className="border rounded-4 p-3 h-100 bg-light-subtle"><div className="small text-secondary mb-2">{t("dashboard.charts.visual.markers", "Markers")}</div><div className="fw-semibold">{granularity === "hourly" ? t("dashboard.charts.visual.hourView", "Hourly view") : t("dashboard.charts.visual.dayView", "Daily view")}</div><div className="small text-secondary mt-2">{t("dashboard.charts.visual.maxRevenue", "Max revenue")}: {formatPrice(maxRevenue)}</div><div className="small text-secondary">{t("dashboard.charts.visual.maxOrders", "Max orders")}: {formatCount(maxOrders || 0)}</div></div></div>
          </div>
          <div className="d-flex justify-content-between gap-2 small text-secondary mt-3 flex-wrap">{chartData.map((item, index) => tickIndexes.includes(index) ? <span key={item.bucket}>{item.label}</span> : <span key={item.bucket} />)}</div>
        </>
      ) : <div className="text-secondary">{t("dashboard.empty.period", "No data for this period.")}</div>}
    </div>
  );
}
function BarChartCard({ title, data, labels, t }) {
  const maxValue = Math.max(...data.map((item) => Number(item.count || 0)), 1);

  return (
    <div className="bg-white rounded-4 shadow-sm p-4 border h-100">
      <div className="fw-semibold mb-3">{title}</div>
      <div className="d-flex flex-column gap-3">
        {data.length ? data.map((item) => <div key={item.key}><div className="d-flex align-items-center justify-content-between small mb-1"><span>{labels[item.key] || item.key}</span><strong>{item.count}</strong></div><div className="progress" style={{ height: 10 }}><div className="progress-bar bg-warning" style={{ width: `${(Number(item.count || 0) / maxValue) * 100}%` }} /></div></div>) : <div className="text-secondary">{t("dashboard.empty.available", "No data available.")}</div>}
      </div>
    </div>
  );
}

function TopProductsBarChart({ title, data, formatPrice, t }) {
  return (
    <div className="bg-white rounded-4 shadow-sm p-4 border h-100">
      <div className="d-flex align-items-center justify-content-between mb-3"><div className="fw-semibold">{title}</div><span className="small text-secondary">{t("dashboard.topProducts.byRevenue", "By revenue")}</span></div>
      {data.length ? <div className="d-flex flex-column gap-3">{data.map((item) => <div key={item.product_id || item.sku}><div className="d-flex align-items-center justify-content-between mb-1 gap-3 border-bottom"><div><div className="fw-semibold">{item.product_name}</div><div className="small text-secondary">{item.quantity_sold} {t("dashboard.topProducts.sales", "sales")}</div></div><div className="small fw-semibold text-primary">{formatPrice(item.revenue_total)}</div></div></div>)}</div> : <div className="text-secondary">{t("dashboard.empty.sales", "No sales for this period.")}</div>}
    </div>
  );
}

function CitySalesChart({ data, formatPrice, formatCount, t }) {
  const maxValue = Math.max(...data.map((item) => Number(item.revenue_total || 0)), 1);

  return (
    <div className="bg-white rounded-4 shadow-sm p-4 border h-100">
      <div className="d-flex align-items-center justify-content-between mb-3"><div><div className="fw-semibold">{t("dashboard.citySales.title", "Revenue by city")}</div><div className="small text-secondary">{t("dashboard.citySales.subtitle", "Revenue from products sold by city")}</div></div><span className="small text-secondary">{t("dashboard.common.top10", "Top 10")}</span></div>
      {data.length ? <div className="d-flex flex-column gap-3">{data.map((item) => <div key={item.city_id || item.city_name}><div className="d-flex align-items-center justify-content-between small mb-1 gap-3"><div className="fw-semibold text-truncate">{item.city_name}</div><div className="text-end"><div>{formatPrice(item.revenue_total)}</div><div className="text-secondary">{formatCount(item.orders_count || 0)} {t("dashboard.common.orders", "orders")}</div></div></div><div className="progress" style={{ height: 12 }}><div className="progress-bar bg-success" style={{ width: `${(Number(item.revenue_total || 0) / maxValue) * 100}%` }} /></div><div className="small text-secondary mt-1">{formatCount(item.quantity_sold || 0)} {t("dashboard.common.productsSold", "products sold")}</div></div>)}</div> : <div className="text-secondary">{t("dashboard.empty.citySales", "No city sales for this period.")}</div>}
    </div>
  );
}

function CityQuantityChart({ data, formatPrice, formatCount, t }) {
  const maxValue = Math.max(...data.map((item) => Number(item.quantity_sold || 0)), 1);

  return (
    <div className="bg-white rounded-4 shadow-sm p-4 border h-100">
      <div className="d-flex align-items-center justify-content-between mb-3"><div><div className="fw-semibold">{t("dashboard.cityQuantity.title", "Quantity sold by city")}</div><div className="small text-secondary">{t("dashboard.cityQuantity.subtitle", "Volume of products sold by city")}</div></div><span className="small text-secondary">{t("dashboard.common.top10", "Top 10")}</span></div>
      {data.length ? <div className="d-flex flex-column gap-3">{data.map((item) => <div key={item.city_id || item.city_name}><div className="d-flex align-items-center justify-content-between small mb-1 gap-3"><div className="fw-semibold text-truncate">{item.city_name}</div><div className="text-end"><div>{formatCount(item.quantity_sold || 0)} {t("dashboard.common.products", "products")}</div><div className="text-secondary">{formatPrice(item.revenue_total)}</div></div></div><div className="progress" style={{ height: 12 }}><div className="progress-bar bg-primary" style={{ width: `${(Number(item.quantity_sold || 0) / maxValue) * 100}%` }} /></div><div className="small text-secondary mt-1">{formatCount(item.orders_count || 0)} {t("dashboard.common.orders", "orders")}</div></div>)}</div> : <div className="text-secondary">{t("dashboard.empty.citySales", "No city sales for this period.")}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const { lang, t } = useI18n();
  const [filters, setFilters] = useState({ mode: "daily", start_date: "", end_date: "", month: "" });
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatCount = (value) => Number(value || 0).toLocaleString(lang || "fr-FR");
  const formatPrice = (value) => `${Number(value || 0).toLocaleString(lang || "fr-FR")} MGA`;
  const formatDateTime = (value) => (!value ? "-" : new Date(value).toLocaleString(lang || "fr-FR"));

  const ORDER_STATUS_LABELS = {
    pending: t("dashboard.orderStatus.pending", "Pending"),
    confirmed: t("dashboard.orderStatus.confirmed", "Confirmed"),
    processing: t("dashboard.orderStatus.processing", "Processing"),
    delivered: t("dashboard.orderStatus.delivered", "Delivered"),
    cancelled: t("dashboard.orderStatus.cancelled", "Cancelled")
  };
  const PAYMENT_STATUS_LABELS = {
    unpaid: t("dashboard.paymentStatus.unpaid", "Unpaid"),
    pending_verification: t("dashboard.paymentStatus.pending_verification", "Verification"),
    paid: t("dashboard.paymentStatus.paid", "Paid"),
    refunded: t("dashboard.paymentStatus.refunded", "Refunded")
  };

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const data = await getAdminDashboard({ mode: filters.mode, start_date: filters.mode === "daily" ? filters.start_date || undefined : undefined, end_date: filters.mode === "daily" ? filters.end_date || undefined : undefined, month: filters.mode === "monthly" ? filters.month || undefined : undefined });
        if (!cancelled) {
          setDashboard(data);
          if (!filters.start_date || !filters.end_date) {
            setFilters((prev) => ({ ...prev, start_date: prev.start_date || data?.filters?.start_date || "", end_date: prev.end_date || data?.filters?.end_date || "", month: prev.month || data?.filters?.month || "" }));
          }
        }
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || t("dashboard.errors.load", "Unable to load the dashboard."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadDashboard();
    return () => { cancelled = true; };
  }, [filters.mode, filters.start_date, filters.end_date, filters.month, t]);

  const summary = dashboard?.summary || {};
  const series = dashboard?.series || [];
  const statusBreakdown = dashboard?.status_breakdown || [];
  const paymentBreakdown = dashboard?.payment_breakdown || [];
  const topProducts = dashboard?.top_products || [];
  const citySales = dashboard?.city_sales || [];
  const recentOrders = dashboard?.recent_orders || [];
  const recentActivity = dashboard?.recent_activity || [];
  const seriesGranularity = dashboard?.filters?.series_granularity || "daily";
  const bestCity = citySales[0] || null;
  return (
    <div className="d-flex flex-column gap-4">
      <div className="bg-white rounded-4 shadow-sm p-4 border">
        <div className="d-flex flex-column flex-xl-row justify-content-between gap-3">
          <div><h1 className="fw-bold mb-1">{t("dashboard.title", "Dashboard")}</h1></div>
          <div className="d-flex flex-column flex-md-row gap-2">
            <div className="btn-group" role="group" aria-label={t("dashboard.filters.aria", "Dashboard period")}>
              <button type="button" className={`btn ${filters.mode === "daily" ? "btn-warning" : "btn-outline-warning"}`} onClick={() => setFilters((prev) => ({ ...prev, mode: "daily" }))}>{t("dashboard.filters.daily", "Daily")}</button>
              <button type="button" className={`btn ${filters.mode === "monthly" ? "btn-warning" : "btn-outline-warning"}`} onClick={() => setFilters((prev) => ({ ...prev, mode: "monthly", month: prev.month || dashboard?.filters?.month || "" }))}>{t("dashboard.filters.monthly", "Monthly")}</button>
            </div>
            {filters.mode === "daily" ? <><input type="date" className="form-control" value={filters.start_date} onChange={(e) => setFilters((prev) => ({ ...prev, start_date: e.target.value }))} /><input type="date" className="form-control" value={filters.end_date} onChange={(e) => setFilters((prev) => ({ ...prev, end_date: e.target.value }))} /></> : <input type="month" className="form-control" value={filters.month} onChange={(e) => setFilters((prev) => ({ ...prev, month: e.target.value }))} />}
            <button type="button" className="btn btn-outline-secondary" onClick={() => setFilters((prev) => ({ ...prev, start_date: "", end_date: "", month: "" }))}>{t("dashboard.filters.reset", "Reset")}</button>
          </div>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {loading ? <div className="bg-white rounded-4 shadow-sm p-5 text-center border"><div className="spinner-border spinner-border-sm me-2" />{t("dashboard.loading", "Loading dashboard...")}</div> : null}

      {!loading ? <>
        <div className="row g-3">
          <StatCard title={t("dashboard.stats.revenue", "Collected revenue")} value={formatPrice(summary.revenue_total)} hint={`${formatCount(summary.paid_orders_count || 0)} ${t("dashboard.hints.paidOrders", "paid orders")}`} icon="bi-cash-coin" />
          <StatCard title={t("dashboard.stats.orders", "Orders in period")} value={formatCount(summary.orders_count || 0)} hint={`${formatCount(summary.cancelled_orders_count || 0)} ${t("dashboard.hints.cancelled", "cancelled")}`} icon="bi-receipt" tone="primary" />
          <StatCard title={t("dashboard.stats.averageBasket", "Average basket")} value={formatPrice(summary.average_order_value)} hint={`${formatCount(summary.completed_orders_count || 0)} ${t("dashboard.hints.activeOrders", "active orders")}`} icon="bi-bag-check" tone="success" />
          <StatCard title={t("dashboard.stats.newCustomers", "New customers")} value={formatCount(summary.new_customers_count || 0)} hint={`${formatCount(summary.customers_total || 0)} ${t("dashboard.hints.totalCustomers", "customers total")}`} icon="bi-people" tone="info" />
          <StatCard title={t("dashboard.stats.pendingPayments", "Payments to verify")} value={formatCount(summary.pending_payments_count || 0)} hint={t("dashboard.hints.mobileMoney", "Pending mobile money")} icon="bi-phone" tone="danger" />
          <StatCard title={t("dashboard.stats.pendingOrders", "Pending orders")} value={formatCount(summary.pending_orders_count || 0)} hint={t("dashboard.hints.confirmProcess", "To confirm or process")} icon="bi-hourglass-split" tone="warning" />
          <StatCard title={t("dashboard.stats.activeReservations", "Active reservations")} value={formatCount(summary.active_reservations_count || 0)} hint={t("dashboard.hints.blockedProducts", "Products still blocked")} icon="bi-bookmark-check" tone="primary" />
          <StatCard title={t("dashboard.stats.activeProducts", "Active products")} value={formatCount(summary.active_products_count || 0)} hint={`${formatCount(summary.products_total || 0)} ${t("dashboard.hints.catalogProducts", "products in catalog")}`} icon="bi-box-seam" tone="success" />
          <StatCardXL title={t("dashboard.stats.bestCity", "Top revenue city")} value={bestCity?.city_name || "-"} hint={bestCity ? `${formatPrice(bestCity.revenue_total)} - ${formatCount(bestCity.quantity_sold || 0)} ${t("dashboard.common.products", "products")}` : t("dashboard.empty.noCitySales", "No city sales")} icon="bi-geo-alt" tone="success" />
        </div>

        <div className="row g-2"><div className="col-12"><LineChartCard data={series} granularity={seriesGranularity} formatPrice={formatPrice} formatCount={formatCount} t={t} /></div>
        <div className="col-12"><div className="bg-white rounded-4 shadow-sm p-4 border h-100"><div className="fw-semibold mb-3">{t("dashboard.attention.title", "Admin attention points")}</div><div className="row"><div className="col-md-3 mb-2"><div className="border rounded-4 p-3 h-100"><div className="small text-secondary">{t("dashboard.attention.pendingPayments", "Payments to validate")}</div><div className="fw-bold fs-5">{summary.pending_payments_count || 0}</div><Link to="/admin/orders" className="small">{t("dashboard.attention.openOrders", "Open orders")}</Link></div></div><div className="col-md-3 mb-2"><div className="border rounded-4 p-3 h-100"><div className="small text-secondary">{t("dashboard.attention.pendingOrders", "Pending orders")}</div><div className="fw-bold fs-5">{summary.pending_orders_count || 0}</div><Link to="/admin/orders" className="small">{t("dashboard.attention.confirmProcess", "Confirm or process")}</Link></div></div><div className="col-md-3 mb-2"><div className="border rounded-4 p-3 h-100"><div className="small text-secondary">{t("dashboard.attention.activeReservations", "Active reservations")}</div><div className="fw-bold fs-5">{summary.active_reservations_count || 0}</div><Link to="/admin/reservations" className="small">{t("dashboard.attention.viewReservations", "View reservations")}</Link></div></div><div className="col-md-3 mb-2"><div className="border rounded-4 p-3 h-100"><div className="small text-secondary">{t("dashboard.attention.activeCatalog", "Active catalog")}</div><div className="fw-bold fs-5">{summary.active_products_count || 0}</div><Link to="/admin/categories" className="small">{t("dashboard.attention.manageProducts", "Manage products")}</Link></div></div></div></div></div></div>

        <div className="row g-4"><div className="col-12 col-lg-6"><BarChartCard title={t("dashboard.breakdown.orders", "Order breakdown")} data={statusBreakdown} labels={ORDER_STATUS_LABELS} t={t} /></div><div className="col-12 col-lg-6"><BarChartCard title={t("dashboard.breakdown.payments", "Payment breakdown")} data={paymentBreakdown} labels={PAYMENT_STATUS_LABELS} t={t} /></div></div>
        <div className="row g-4"><div className="col-12 xl col-xl-6"><TopProductsBarChart title={t("dashboard.topProducts.title", "Top sold products")} data={topProducts} formatPrice={formatPrice} t={t} /></div><div className="col-12 xl col-xl-6"><CitySalesChart data={citySales} formatPrice={formatPrice} formatCount={formatCount} t={t} /></div></div>
        <div className="row g-4"><div className="col-12"><CityQuantityChart data={citySales} formatPrice={formatPrice} formatCount={formatCount} t={t} /></div></div>
        <div className="row g-4">
          <div className="col-12 xl col-xl-6">
            <div className="bg-white rounded-4 shadow-sm p-4 border h-100">
              <div className="d-flex align-items-center justify-content-between mb-3"><div className="fw-semibold">{t("dashboard.recentOrders.title", "Latest orders")}</div><Link to="/admin/orders" className="small">{t("dashboard.actions.viewMore", "View more")}</Link></div>
              <div className="table-responsive"><table className="table align-middle mb-0"><thead><tr><th>{t("dashboard.recentOrders.table.order", "Order")}</th><th>{t("dashboard.recentOrders.table.customer", "Customer")}</th><th>{t("dashboard.recentOrders.table.amount", "Amount")}</th><th>{t("dashboard.recentOrders.table.status", "Status")}</th></tr></thead><tbody>{recentOrders.length ? recentOrders.map((order) => <tr key={order.id}><td><div className="fw-semibold">{order.order_number}</div><div className="small text-secondary">{formatDateTime(order.created_at)}</div></td><td><div>{order.customer_name || "-"}</div><div className="small text-secondary">{order.customer_email || "-"}</div></td><td>{formatPrice(order.total)}</td><td><div className="d-flex flex-column gap-1"><span className={`badge ${statusBadgeClass(order.status)}`}>{ORDER_STATUS_LABELS[order.status] || order.status}</span><span className={`badge ${statusBadgeClass(order.payment_status)}`}>{PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status}</span></div></td></tr>) : <tr><td colSpan={4} className="text-center text-secondary py-4">{t("dashboard.recentOrders.empty", "No recent orders.")}</td></tr>}</tbody></table></div>
              <div className="small text-secondary mt-3">{t("dashboard.recentOrders.footer", "Showing the last 10 orders.")}</div>
            </div>
          </div>

          <div className="col-12 xl col-xl-6">
            <div className="bg-white rounded-4 shadow-sm p-4 border h-100">
              <div className="d-flex align-items-center justify-content-between mb-3"><div className="fw-semibold">{t("dashboard.cityTable.title", "Orders by city")}</div><span className="small text-secondary">{t("dashboard.common.top10Cities", "Top 10 cities")}</span></div>
              <div className="table-responsive"><table className="table align-middle mb-0"><thead><tr><th>{t("dashboard.cityTable.city", "City")}</th><th>{t("dashboard.cityTable.orders", "Orders")}</th><th>{t("dashboard.cityTable.products", "Products")}</th><th>{t("dashboard.cityTable.revenue", "Revenue")}</th></tr></thead><tbody>{citySales.length ? citySales.map((item) => <tr key={item.city_id || item.city_name}><td className="fw-semibold">{item.city_name}</td><td>{formatCount(item.orders_count || 0)}</td><td>{formatCount(item.quantity_sold || 0)}</td><td>{formatPrice(item.revenue_total)}</td></tr>) : <tr><td colSpan={4} className="text-center text-secondary py-4">{t("dashboard.cityTable.empty", "No city data.")}</td></tr>}</tbody></table></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-4 shadow-sm p-4 border">
          <div className="d-flex align-items-center justify-content-between mb-3"><div className="fw-semibold">{t("dashboard.activity.title", "Recent admin activity")}</div><Link to="/admin/activity-logs" className="small">{t("dashboard.actions.viewMore", "View more")}</Link></div>
          <div className="table-responsive"><table className="table align-middle mb-0"><thead><tr><th>{t("dashboard.activity.table.date", "Date")}</th><th>{t("dashboard.activity.table.action", "Action")}</th><th>{t("dashboard.activity.table.user", "User")}</th><th>{t("dashboard.activity.table.message", "Message")}</th></tr></thead><tbody>{recentActivity.length ? recentActivity.map((log) => <tr key={log.id}><td>{formatDateTime(log.created_at)}</td><td><span className={`badge text-bg-${log.color || "secondary"}`}>{log.action}</span></td><td>{log.user_name || "-"}</td><td>{log.message || "-"}</td></tr>) : <tr><td colSpan={4} className="text-center text-secondary py-4">{t("dashboard.activity.empty", "No recent activity.")}</td></tr>}</tbody></table></div>
          <div className="small text-secondary mt-3">{t("dashboard.activity.footer", "Showing the last 10 activities.")}</div>
        </div>
      </> : null}
    </div>
  );
}
