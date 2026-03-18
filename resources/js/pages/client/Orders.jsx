import { useEffect, useMemo, useState } from "react";
import { listMyOrders } from "../../api/client_orders";

function formatPriceMGA(value) {
  return `${Number(value || 0).toLocaleString("fr-FR")} MGA`;
}

const STATUS_LABELS = {
  pending: "En attente",
  confirmed: "Confirmée",
  packed: "Préparée",
  shipped: "Expédiée",
  delivered: "Livrée",
  canceled: "Annulée",
};

const STATUS_COLORS = {
  pending: "warning",
  confirmed: "info",
  packed: "primary",
  shipped: "primary",
  delivered: "success",
  canceled: "danger",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      setLoading(true);
      setError("");

      try {
        const data = await listMyOrders();
        if (!cancelled) setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Impossible de charger les commandes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((order) => order.status === "pending").length,
      delivered: orders.filter((order) => order.status === "delivered").length,
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="bg-white rounded-4 shadow-sm p-5 text-center">
        <div className="spinner-border spinner-border-sm me-2" />
        Chargement des commandes...
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      <div className="bg-white rounded-4 shadow-sm p-4">
        <h1 className="h4 fw-bold mb-1">Mes commandes</h1>
        <p className="text-secondary mb-4">Suivez vos achats, leur statut et votre historique.</p>

        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="border rounded-4 p-3 h-100">
              <div className="text-secondary small">Total commandes</div>
              <div className="h3 fw-bold mb-0">{summary.total}</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="border rounded-4 p-3 h-100">
              <div className="text-secondary small">En attente</div>
              <div className="h3 fw-bold mb-0">{summary.pending}</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="border rounded-4 p-3 h-100">
              <div className="text-secondary small">Livrées</div>
              <div className="h3 fw-bold mb-0">{summary.delivered}</div>
            </div>
          </div>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      {orders.length === 0 ? (
        <div className="bg-white rounded-4 shadow-sm p-5 text-center text-secondary">
          Vous n'avez encore passé aucune commande.
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="bg-white rounded-4 shadow-sm p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
              <div>
                <div className="small text-secondary">Commande</div>
                <div className="fw-bold">{order.order_number}</div>
                <div className="text-secondary small">
                  {new Date(order.created_at).toLocaleDateString("fr-FR")}
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2 align-items-start">
                <span className={`badge text-bg-${STATUS_COLORS[order.status] || "secondary"}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
                <span className={`badge text-bg-${order.payment_status === "paid" ? "success" : "secondary"}`}>
                  {order.payment_status === "paid" ? "Payée" : "Paiement à la livraison"}
                </span>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-lg-7">
                <div className="fw-semibold mb-2">Articles</div>
                <div className="d-flex flex-column gap-2">
                  {(order.items || []).map((item) => (
                    <div key={item.id} className="d-flex justify-content-between small border rounded-3 px-3 py-2">
                      <span>{item.product_name} × {item.quantity}</span>
                      <strong>{formatPriceMGA(item.line_total)}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-12 col-lg-5">
                <div className="border rounded-4 p-3 h-100">
                  <div className="fw-semibold mb-2">Livraison</div>
                  <div className="small text-secondary mb-2">
                    {order.address?.full_name || "Client"} · {order.address?.phone || "Téléphone non renseigné"}
                  </div>
                  <div className="small mb-3">
                    {[
                      order.address?.address_line1,
                      order.address?.address_line2,
                      order.address?.city_name,
                      order.address?.region,
                    ].filter(Boolean).join(", ")}
                  </div>
                  <div className="d-flex justify-content-between small text-secondary">
                    <span>Total</span>
                    <strong className="text-dark">{formatPriceMGA(order.total)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
