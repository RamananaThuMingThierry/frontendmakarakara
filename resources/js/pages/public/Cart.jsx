import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/website/CartContext";
import { useAuth } from "../../hooks/website/AuthContext";
import { createMyReservation, listMyReservations } from "../../api/client_reservations";
import { useI18n } from "../../hooks/website/I18nContext";

function formatPriceMGA(value) {
  return `${Number(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} MGA`;
}

function computeDiscount(subtotal, code) {
  const c = (code || "").trim().toUpperCase();
  if (!c) return { discount: 0, label: null };

  if (c === "FIX10") return { discount: Math.min(10000, subtotal), labelKey: "cart.coupon.labels.fix10" };
  if (c === "SAVE15") return { discount: Math.round(subtotal * 0.15), labelKey: "cart.coupon.labels.save15" };

  return { discount: 0, labelKey: null };
}

export default function Cart() {
  const { t } = useI18n();
  const { cart, cartCount, total, inc, dec, remove, setQty, clear, clearLocal } = useCart();
  const navigate = useNavigate();
  const { isAuth } = useAuth();
  const [reserving, setReserving] = useState(false);
  const [hasActiveReservation, setHasActiveReservation] = useState(false);
  const [reservationMessage, setReservationMessage] = useState("");
  const [reservationError, setReservationError] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  const subtotal = total;
  const deliveryFee = useMemo(() => 0, []);
  const discountTotal = appliedCoupon?.discount || 0;

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountTotal) + deliveryFee;
  }, [subtotal, discountTotal, deliveryFee]);

  useEffect(() => {
    let cancelled = false;

    async function loadReservations() {
      if (!isAuth) {
        if (!cancelled) setHasActiveReservation(false);
        return;
      }

      try {
        const reservations = await listMyReservations();
        const hasActiveCartReservation = Array.isArray(reservations) && reservations.some((reservation) => {
          return (
            reservation.status === "active" &&
            !reservation.is_expired &&
            reservation.reference_type?.includes("Cart")
          );
        });

        if (!cancelled) setHasActiveReservation(hasActiveCartReservation);
      } catch {
        if (!cancelled) setHasActiveReservation(false);
      }
    }

    loadReservations();
    return () => {
      cancelled = true;
    };
  }, [isAuth]);

  const applyCoupon = () => {
    setCouponError("");
    const { discount, labelKey } = computeDiscount(subtotal, couponInput);

    if (!couponInput.trim()) {
      setCouponError(t("cart.coupon.enterCode", "Enter a coupon code."));
      return;
    }
    if (!labelKey || discount <= 0) {
      setAppliedCoupon(null);
      setCouponError(t("cart.coupon.invalid", "Invalid or not applicable coupon."));
      return;
    }

    setAppliedCoupon({
      code: couponInput.trim().toUpperCase(),
      label: t(labelKey, labelKey === "cart.coupon.labels.fix10" ? "Coupon FIX10 (-10 000 MGA)" : "Coupon SAVE15 (-15%)"),
      discount,
    });
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const goCheckout = () => {
    if (!isAuth) {
      navigate("/login", {
        state: {
          from: { pathname: "/checkout" },
          message: t("cart.messages.loginBeforeCheckout", "Create an account or sign in before ordering."),
        },
      });
      return;
    }

    navigate("/checkout", {
      state: {
        coupon_code: appliedCoupon?.code || null,
        discount_total: discountTotal,
        delivery_fee: deliveryFee,
      },
    });
  };

  const reserveCart = async () => {
    setReservationMessage("");
    setReservationError("");

    if (!isAuth) {
      navigate("/login", {
        state: {
          from: { pathname: "/cart" },
          message: t("cart.messages.loginBeforeReserve", "Sign in to reserve your cart for 24 hours."),
        },
      });
      return;
    }

    setReserving(true);

    try {
      const response = await createMyReservation();
      const expiresAt = response?.data?.expires_at
        ? new Date(response.data.expires_at).toLocaleString()
        : null;

      setReservationMessage(
        expiresAt
          ? t("cart.messages.reservedUntil", "Reservation saved. It will expire on {{date}} if you do not order.").replace("{{date}}", expiresAt)
          : t("cart.messages.reserved24h", "Reservation saved for 24 hours.")
      );
      setHasActiveReservation(true);
      clearLocal();
    } catch (error) {
      setReservationError(error?.response?.data?.message || t("cart.messages.reserveFailed", "Unable to reserve this cart."));
    } finally {
      setReserving(false);
    }
  };

  if (!cartCount) {
    return (
      <div className="container py-5 text-center">
        {reservationMessage && <div className="alert alert-success py-2 mb-4">{reservationMessage}</div>}
        {reservationError && <div className="alert alert-danger py-2 mb-4">{reservationError}</div>}
        <img
          src="/images/shopping-cart.png"
          alt={t("cart.empty.alt", "Empty cart")}
          className="img-fluid mb-4"
          style={{ maxWidth: 260, opacity: 0.9 }}
        />
        <h5 className="fw-semibold">{t("cart.empty.title", "Your cart is empty")}</h5>
        <p className="text-muted">{t("cart.empty.subtitle", "Add products to find them here.")}</p>
        <Link to="/shop" className="btn btn-dark">
          {t("cart.actions.goShop", "Go to shop")}
        </Link>
      </div>
    );
  }

  return (
    <main className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
          <div>
            <h1 className="fw-bold mb-1">{t("cart.title", "Cart")}</h1>
            <p className="text-secondary mb-0">{t("cart.count", "{{count}} item(s)").replace("{{count}}", cartCount)}</p>
          </div>

          <button className="btn btn-outline-danger" type="button" onClick={clear}>
            <i className="bi bi-trash me-2" />
            {t("cart.actions.clear", "Clear cart")}
          </button>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <div className="bg-white rounded-4 shadow-sm p-3 p-md-4">
              {cart.map((item) => (
                <div key={item.id} className="py-3 border-bottom">
                  <div className="d-flex gap-3">
                    <img
                      src={item.image || "/images/placeholder-product.png"}
                      alt={item.name}
                      style={{ width: 90, height: 90, objectFit: "cover" }}
                      className="rounded-3 border"
                    />

                    <div className="flex-grow-1">
                      <div className="d-flex align-items-start justify-content-between gap-3">
                        <div>
                          <div className="fw-semibold">{item.name}</div>
                          <div className="text-secondary small">
                            {t("cart.price", "Price")} : <span className="fw-semibold">{formatPriceMGA(item.price)}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-link text-danger p-0"
                          onClick={() => remove(item.id)}
                          title={t("cart.actions.remove", "Remove")}
                        >
                          <i className="bi bi-x-lg" />
                        </button>
                      </div>

                      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mt-3">
                        <div className="d-inline-flex align-items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => (item.qty === 1 ? remove(item.id) : dec(item.id))}
                            title={item.qty === 1 ? t("cart.actions.remove", "Remove") : t("cart.actions.decrease", "Decrease")}
                          >
                            {item.qty === 1 ? <i className="bi bi-trash" /> : "-"}
                          </button>

                          <input
                            type="number"
                            className="form-control form-control-sm text-center"
                            style={{ width: 70 }}
                            value={item.qty}
                            min={1}
                            onChange={(e) => setQty(item.id, e.target.value)}
                          />

                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => inc(item.id)}
                            title={t("cart.actions.increase", "Increase")}
                          >
                            +
                          </button>
                        </div>

                        <div className="fw-bold text-danger">{formatPriceMGA(item.price * item.qty)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-3 d-flex justify-content-end">
                <Link to="/shop" className="btn btn-outline-dark">
                  {t("cart.actions.continueShopping", "Continue shopping")}
                </Link>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="bg-white rounded-4 shadow-sm p-4">
              <h5 className="fw-bold mb-3">{t("cart.summary.title", "Summary")}</h5>

              {!isAuth ? (
                <div className="alert alert-warning py-2">
                  {t("cart.summary.deviceNotice", "Your cart is saved on this device. Sign in to keep it on your account and complete the order.")}
                </div>
              ) : null}

              {reservationMessage && <div className="alert alert-success py-2">{reservationMessage}</div>}
              {reservationError && <div className="alert alert-danger py-2">{reservationError}</div>}

              <div className="mb-3">
                <div className="fw-semibold mb-2">{t("cart.coupon.title", "Coupon")}</div>

                <div className="input-group">
                  <input
                    className="form-control"
                    placeholder={t("cart.coupon.placeholder", "Enter a code (e.g. FIX10, SAVE15)")}
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    disabled={!!appliedCoupon}
                  />
                  {!appliedCoupon ? (
                    <button className="btn btn-outline-dark" type="button" onClick={applyCoupon}>
                      {t("cart.coupon.apply", "Apply")}
                    </button>
                  ) : (
                    <button className="btn btn-outline-danger" type="button" onClick={removeCoupon}>
                      {t("cart.coupon.remove", "Remove")}
                    </button>
                  )}
                </div>

                {couponError && <div className="text-danger small mt-2">{couponError}</div>}

                {appliedCoupon && (
                  <div className="text-success small mt-2">
                    <i className="bi bi-check-circle me-1" />
                    {appliedCoupon.label}
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>{t("cart.summary.subtotal", "Subtotal")}</span>
                <span className="fw-semibold">{formatPriceMGA(subtotal)}</span>
              </div>

              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>{t("cart.summary.discount", "Discount")}</span>
                <span className="fw-semibold">{discountTotal > 0 ? `- ${formatPriceMGA(discountTotal)}` : "-"}</span>
              </div>

              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>{t("cart.summary.delivery", "Delivery")}</span>
                <span className="fw-semibold">{t("cart.summary.deliveryPending", "To be confirmed by the administration")}</span>
              </div>

              <hr />

              <div className="d-flex justify-content-between">
                <span className="fw-bold">{t("cart.summary.total", "Estimated total")}</span>
                <span className="fw-bold text-danger">{formatPriceMGA(grandTotal)}</span>
              </div>

              <div className="d-grid gap-2 mt-3">
                {!hasActiveReservation ? (
                  <button
                    className="btn btn-outline-dark fw-semibold"
                    type="button"
                    onClick={reserveCart}
                    disabled={reserving}
                  >
                    {reserving ? t("cart.actions.reserving", "Reserving...") : t("cart.actions.reserve24h", "Reserve for 24h")}
                  </button>
                ) : null}

                <button className="btn btn-warning fw-semibold" type="button" onClick={goCheckout}>
                  {t("cart.actions.order", "Order")}
                </button>
              </div>

              <small className="text-secondary d-block mt-2">
                {t("cart.summary.deliveryHelp", "The delivery fee will be confirmed by the administration based on distance, and may be free.")}
              </small>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
