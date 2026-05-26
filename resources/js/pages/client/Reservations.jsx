import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cancelMyReservation, checkoutMyReservation, listMyReservations } from "../../api/client_reservations";
import { useCart } from "../../hooks/website/CartContext";
import { useI18n } from "../../hooks/website/I18nContext";

const STATUS_LABELS = {
  active: "Active",
  released: "Liberee",
  consumed: "Consommee",
};

const STATUS_COLORS = {
  active: "warning",
  released: "secondary",
  consumed: "success",
};

export default function Reservations() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [checkoutingId, setCheckoutingId] = useState(null);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReservations() {
      setLoading(true);
      setError("");

      try {
        const data = await listMyReservations();
        if (!cancelled) setReservations(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || t("reservations.client.errors.load", "Impossible de charger les reservations."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReservations();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleCancel = async (reservationId) => {
    setError("");
    setActionMessage(null);
    setCancellingId(reservationId);

    try {
      await cancelMyReservation(reservationId);
      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === reservationId
            ? { ...reservation, status: "released" }
            : reservation
        )
      );
      setActionMessage({
        type: "success",
        text: t("reservations.client.messages.cancelled", "Reservation annulee avec succes."),
      });
    } catch (err) {
      setError(err?.response?.data?.message || t("reservations.client.errors.cancel", "Impossible d'annuler la reservation."));
    } finally {
      setCancellingId(null);
    }
  };

  const handleCheckout = async (reservationId) => {
    setError("");
    setActionMessage({
      type: "info",
      text: t("reservations.client.messages.checkoutPreparing", "Reservation en cours de transformation en commande..."),
    });
    setCheckoutingId(reservationId);

    try {
      await checkoutMyReservation(reservationId);
      await refreshCart();
      navigate("/checkout");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          t("reservations.client.errors.checkout", "Impossible de preparer cette reservation pour la commande.")
      );
    } finally {
      setCheckoutingId(null);
    }
  };

  const summary = useMemo(() => {
    return {
      total: reservations.length,
      active: reservations.filter((item) => item.status === "active" && !item.is_expired).length,
      consumed: reservations.filter((item) => item.status === "consumed").length,
    };
  }, [reservations]);

  if (loading) {
    return (
      <div className="bg-white rounded-4 shadow-sm p-5 text-center">
        <div className="spinner-border spinner-border-sm me-2" />
        {t("reservations.client.loading", "Chargement des reservations...")}
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      <div className="bg-white rounded-4 shadow-sm p-4">
        <h1 className="h4 fw-bold mb-1">{t("reservations.client.title", "Mes reservations")}</h1>
        <p className="text-secondary mb-4">
          {t("reservations.client.subtitle", "Consultez vos reservations et les articles associes.")}
        </p>

        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="border rounded-4 p-3 h-100">
              <div className="text-secondary small">{t("reservations.client.summary.total", "Total reservations")}</div>
              <div className="h3 fw-bold mb-0">{summary.total}</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="border rounded-4 p-3 h-100">
              <div className="text-secondary small">{t("reservations.status.active", "Active")}</div>
              <div className="h3 fw-bold mb-0">{summary.active}</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="border rounded-4 p-3 h-100">
              <div className="text-secondary small">{t("reservations.status.consumed", "Consommee")}</div>
              <div className="h3 fw-bold mb-0">{summary.consumed}</div>
            </div>
          </div>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {actionMessage ? <div className={`alert alert-${actionMessage.type}`}>{actionMessage.text}</div> : null}

      {reservations.length === 0 ? (
        <div className="bg-white rounded-4 shadow-sm p-5 text-center text-secondary">
          {t("reservations.client.empty", "Vous n'avez encore aucune reservation.")}
        </div>
      ) : (
        reservations.map((reservation) => {
          const isActive = reservation.status === "active" && !reservation.is_expired;
          const items = Array.isArray(reservation.items) ? reservation.items : [];

          return (
            <div key={reservation.id} className="bg-white rounded-4 shadow-sm p-4">
              <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
                <div>
                  <div className="small text-secondary">{t("reservations.client.card.title", "Reservation")}</div>
                  <div className="fw-bold">{reservation.product_name || t("reservations.client.card.fallback", "Reservation")}</div>
                  <div className="text-secondary small">
                    {t("reservations.client.card.itemsCount", "{{count}} article(s)").replace("{{count}}", reservation.items_count || 0)} ·{" "}
                    {t("reservations.client.card.totalQuantity", "Quantite totale")}: {reservation.quantity || 0}
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-2 align-items-start">
                  <span className={`badge text-bg-${STATUS_COLORS[reservation.status] || "secondary"}`}>
                    {t(`reservations.status.${reservation.status}`, STATUS_LABELS[reservation.status] || reservation.status)}
                  </span>
                  {isActive ? (
                    <span className="badge text-bg-info">
                      {t("reservations.show.expiresAt", "Expire le")}{" "}
                      {reservation.expires_at ? new Date(reservation.expires_at).toLocaleString("fr-FR") : "-"}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="border rounded-4 p-3">
                <div className="small text-secondary mb-1">{t("reservations.items.title", "Items")}</div>
                {items.length > 0 ? (
                  <div className="mb-3 d-flex flex-column gap-1">
                    {items.map((item) => (
                      <div key={item.id} className="small">
                        {item.product_name || t("reservations.items.product", "Produit")} ·{" "}
                        {item.city_name || t("reservations.client.card.cityUnavailable", "Ville non renseignee")} ·{" "}
                        {t("reservations.client.card.qty", "Qte")} {item.quantity}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="small text-secondary mb-3">{t("reservations.items.empty", "Aucun item disponible.")}</div>
                )}

                <div className="small text-secondary mb-1">{t("reservations.show.source", "Source")}</div>
                <div className="fw-semibold">
                  {reservation.reference_type?.includes("Cart")
                    ? t("reservations.client.source.cart", "Reservation depuis le panier")
                    : reservation.reference_type?.includes("Order")
                      ? t("reservations.client.source.order", "Reservation convertie en commande")
                      : t("reservations.client.source.reservation", "Reservation client")}
                </div>
                {!isActive && reservation.expires_at ? (
                  <div className="small text-secondary mt-2">
                    {t("reservations.client.card.expiration", "Expiration")}: {new Date(reservation.expires_at).toLocaleString("fr-FR")}
                  </div>
                ) : null}

                {isActive ? (
                  <div className="mt-3 d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-warning btn-sm"
                      onClick={() => handleCheckout(reservation.id)}
                      disabled={checkoutingId === reservation.id || cancellingId === reservation.id}
                    >
                      {checkoutingId === reservation.id
                        ? t("reservations.client.actions.preparing", "Preparation...")
                        : t("reservations.client.actions.checkout", "Passer a la commande")}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleCancel(reservation.id)}
                      disabled={cancellingId === reservation.id || checkoutingId === reservation.id}
                    >
                      {cancellingId === reservation.id
                        ? t("reservations.client.actions.cancelling", "Annulation...")
                        : t("reservations.client.actions.cancel", "Annuler la reservation")}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
