import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  cancelMyOrder,
  downloadMyOrderInvoice,
  listMyOrders,
} from "../../api/client_orders";

function formatPriceMGA(value) {
  return `${Number(value || 0).toLocaleString("fr-FR")} MGA`;
}

const STATUS_LABELS = {
  pending: "En attente",
  confirmed: "Confirmee",
  processing: "En traitement",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const STATUS_COLORS = {
  pending: "warning",
  confirmed: "info",
  processing: "primary",
  delivered: "success",
  cancelled: "danger",
};

const PAYMENT_STATUS_LABELS = {
  unpaid: "Non payée",
  pending_verification: "En attente de vérification",
  paid: "Payée",
  refunded: "Remboursée",
};

const PAYMENT_STATUS_COLORS = {
  unpaid: "secondary",
  pending_verification: "warning",
  paid: "success",
  refunded: "dark",
};

function canDownloadInvoice(order) {
  return Boolean(order?.invoice?.number) && ["confirmed", "processing", "delivered"].includes(String(order?.status || ""));
}

function canCancelOrder(status, paymentStatus) {
  if (String(paymentStatus || "") === "paid") return false;
  return ["pending", "confirmed", "processing"].includes(String(status || ""));
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

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
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
          <div>
            <h1 className="h4 fw-bold mb-1">Mes commandes</h1>
            <p className="text-secondary mb-0">Suivez vos achats, leur statut et vos documents.</p>
          </div>
          <div>
            <Link to="/shop" className="btn btn-warning">
              Aller à la boutique
            </Link>
          </div>
        </div>

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
      {actionMessage ? <div className={`alert alert-${actionMessage.type}`}>{actionMessage.text}</div> : null}

      {orders.length === 0 ? (
        <div className="bg-white rounded-4 shadow-sm p-5 text-center text-secondary">
          <div className="mb-3">Vous n'avez encore passe aucune commande.</div>
          <Link to="/shop" className="btn btn-warning">
            Aller à la boutique
          </Link>
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
                <span className={`badge text-bg-${PAYMENT_STATUS_COLORS[order.payment_status] || "secondary"}`}>
                  {PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status}
                </span>
                {canCancelOrder(order.status, order.payment_status) ? (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    disabled={actionLoadingId === order.id}
                    onClick={async () => {
                      const confirmed = window.confirm(
                        `Annuler la commande ${order.order_number} ?`
                      );

                      if (!confirmed) {
                        return;
                      }

                      setActionLoadingId(order.id);
                      setActionMessage(null);

                      try {
                        const response = await cancelMyOrder(order.id);
                        const updatedOrder = response?.data;

                        setOrders((prev) =>
                          prev.map((item) =>
                            item.id === order.id ? { ...item, ...updatedOrder } : item
                          )
                        );
                        setActionMessage({
                          type: "success",
                          text: response?.message || "Commande annulée avec succès.",
                        });
                      } catch (err) {
                        setActionMessage({
                          type: "danger",
                          text:
                            err?.response?.data?.message ||
                            "Impossible d'annuler cette commande.",
                        });
                      } finally {
                        setActionLoadingId(null);
                      }
                    }}
                  >
                    {actionLoadingId === order.id ? "Annulation..." : "Annuler"}
                  </button>
                ) : null}
                {canDownloadInvoice(order) ? (
                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm"
                    disabled={actionLoadingId === `invoice-${order.id}`}
                    onClick={async () => {
                      setActionLoadingId(`invoice-${order.id}`);
                      setActionMessage(null);

                      try {
                        const blob = await downloadMyOrderInvoice(order.id);
                        const url = window.URL.createObjectURL(
                          new Blob([blob], { type: "application/pdf" })
                        );
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `facture-${order.invoice?.number || order.order_number}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(url);
                      } catch (err) {
                        setActionMessage({
                          type: "danger",
                          text:
                            err?.response?.data?.message ||
                            "Impossible de télécharger la facture.",
                        });
                      } finally {
                        setActionLoadingId(null);
                      }
                    }}
                  >
                    {actionLoadingId === `invoice-${order.id}`
                      ? "Téléchargement..."
                      : "Télécharger facture"}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-lg-7">
                <div className="fw-semibold mb-2">Articles</div>
                <div className="d-flex flex-column gap-2">
                  {(order.items || []).map((item) => (
                    <div key={item.id} className="d-flex justify-content-between small border rounded-3 px-3 py-2">
                      <span>{item.product_name} x {item.quantity}</span>
                      <strong>{formatPriceMGA(item.line_total)}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-12 col-lg-5">
                <div className="border rounded-4 p-3 h-100">
                  <div className="fw-semibold mb-2">Livraison</div>
                  <div className="small text-secondary mb-2">
                    {order.address?.full_name || "Client"} - {order.address?.phone || "Telephone non renseigne"}
                  </div>
                  <div className="small mb-3">
                    {[
                      order.address?.address_line1,
                      order.address?.address_line2,
                      order.address?.city_name,
                      order.address?.region,
                    ].filter(Boolean).join(", ")}
                  </div>
                  <div className="small text-secondary mb-2">
                    Facture : <strong>{order.invoice?.number || "-"}</strong>
                  </div>
                  <div className="small text-secondary mb-3">
                    Recu : <strong>{order.receipt?.number || "-"}</strong>
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
