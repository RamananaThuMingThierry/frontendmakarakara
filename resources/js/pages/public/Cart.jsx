import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/website/CartContext";
import { useAuth } from "../../hooks/website/AuthContext";
import { createMyReservation, listMyReservations } from "../../api/client_reservations";

function formatPriceMGA(value) {
  return `${Number(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} MGA`;
}

/**
 * ✅ Coupon demo (front-only). Plus tard: on remplace par API Laravel.
 * - FIX10 = -10 000 MGA
 * - SAVE15 = -15%
 */
function computeDiscount(subtotal, code) {
  const c = (code || "").trim().toUpperCase();
  if (!c) return { discount: 0, label: null };

  if (c === "FIX10") return { discount: Math.min(10000, subtotal), label: "Coupon FIX10 (−10 000 MGA)" };
  if (c === "SAVE15") return { discount: Math.round(subtotal * 0.15), label: "Coupon SAVE15 (−15%)" };

  return { discount: 0, label: null };
}

export default function Cart() {
  const { cart, cartCount, total, inc, dec, remove, setQty, clear, clearLocal } = useCart();
  const navigate = useNavigate();
  const { isAuth } = useAuth();
  const [reserving, setReserving] = useState(false);
  const [hasActiveReservation, setHasActiveReservation] = useState(false);
  const [reservationMessage, setReservationMessage] = useState("");
  const [reservationError, setReservationError] = useState("");

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, label, discount }
  const [couponError, setCouponError] = useState("");

  // Subtotal = total du context (sans livraison / sans remise)
  const subtotal = total;

  // ✅ Delivery fee (démo). Plus tard: calcul selon ville / distance GPS.
  const deliveryFee = useMemo(() => {
    // exemple: si sous-total >= 150 000 => livraison gratuite
    if (subtotal >= 150000) return 0;
    return cartCount ? 0 : 0;
  }, [subtotal, cartCount]);

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
      } catch (error) {
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
    const { discount, label } = computeDiscount(subtotal, couponInput);

    if (!couponInput.trim()) {
      setCouponError("Entrez un code coupon.");
      return;
    }
    if (!label || discount <= 0) {
      setAppliedCoupon(null);
      setCouponError("Coupon invalide ou non applicable.");
      return;
    }

    setAppliedCoupon({
      code: couponInput.trim().toUpperCase(),
      label,
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
          message: "Créez un compte ou connectez-vous avant de passer commande.",
        },
      });
      return;
    }

    // On passe le coupon vers /checkout (state router)
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
          message: "Connectez-vous pour reserver votre panier pendant 24 heures.",
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
          ? `Reservation enregistree. Elle expirera le ${expiresAt} si vous ne passez pas commande.`
          : "Reservation enregistree pour 24 heures."
      );
      setHasActiveReservation(true);
      clearLocal();
    } catch (error) {
      setReservationError(error?.response?.data?.message || "Impossible de reserver ce panier.");
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
          alt="Panier vide"
          className="img-fluid mb-4"
          style={{ maxWidth: 260, opacity: 0.9 }}
        />
        <h5 className="fw-semibold">Votre panier est vide</h5>
        <p className="text-muted">Ajoutez des produits pour les retrouver ici.</p>
        <Link to="/shop" className="btn btn-dark">
          Aller à la boutique
        </Link>
      </div>
    );
  }

  return (
    <main className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
          <div>
            <h1 className="fw-bold mb-1">Panier</h1>
            <p className="text-secondary mb-0">{cartCount} article(s)</p>
          </div>

          <button className="btn btn-outline-danger" type="button" onClick={clear}>
            <i className="bi bi-trash me-2" />
            Vider le panier
          </button>
        </div>

        <div className="row g-4">
          {/* LISTE */}
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
                            Prix : <span className="fw-semibold">{formatPriceMGA(item.price)}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-link text-danger p-0"
                          onClick={() => remove(item.id)}
                          title="Supprimer"
                        >
                          <i className="bi bi-x-lg" />
                        </button>
                      </div>

                      {/* QTY + subtotal */}
                      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mt-3">
                        <div className="d-inline-flex align-items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => (item.qty === 1 ? remove(item.id) : dec(item.id))}
                            title={item.qty === 1 ? "Supprimer" : "Diminuer"}
                          >
                            {item.qty === 1 ? <i className="bi bi-trash" /> : "−"}
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
                            title="Augmenter"
                          >
                            +
                          </button>
                        </div>

                        <div className="fw-bold text-danger">
                          {formatPriceMGA(item.price * item.qty)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-3 d-flex justify-content-end">
                <Link to="/shop" className="btn btn-outline-dark">
                  Continuer vos achats
                </Link>
              </div>
            </div>
          </div>

          {/* RÉCAP + COUPON */}
          <div className="col-12 col-lg-4">
            <div className="bg-white rounded-4 shadow-sm p-4">
              <h5 className="fw-bold mb-3">Récapitulatif</h5>

              {!isAuth ? (
                <div className="alert alert-warning py-2">
                  Votre panier est sauvegarde sur cet appareil. Connectez-vous pour le conserver aussi sur votre compte et finaliser la commande.
                </div>
              ) : null}

              {reservationMessage && <div className="alert alert-success py-2">{reservationMessage}</div>}
              {reservationError && <div className="alert alert-danger py-2">{reservationError}</div>}

              {/* Coupon */}
              <div className="mb-3">
                <div className="fw-semibold mb-2">Coupon</div>

                <div className="input-group">
                  <input
                    className="form-control"
                    placeholder="Entrer un code (ex: FIX10, SAVE15)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    disabled={!!appliedCoupon}
                  />
                  {!appliedCoupon ? (
                    <button className="btn btn-outline-dark" type="button" onClick={applyCoupon}>
                      Appliquer
                    </button>
                  ) : (
                    <button className="btn btn-outline-danger" type="button" onClick={removeCoupon}>
                      Retirer
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

              {/* Totaux */}
              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>Sous-total</span>
                <span className="fw-semibold">{formatPriceMGA(subtotal)}</span>
              </div>

              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>Remise</span>
                <span className="fw-semibold">
                  {discountTotal > 0 ? `− ${formatPriceMGA(discountTotal)}` : "—"}
                </span>
              </div>

              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>Livraison</span>
                <span className="fw-semibold">
                  {deliveryFee === 0 ? "Gratuite" : formatPriceMGA(deliveryFee)}
                </span>
              </div>

              <hr />

              <div className="d-flex justify-content-between">
                <span className="fw-bold">Total</span>
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
                    {reserving ? "Reservation..." : "Reserver 24h"}
                  </button>
                ) : null}

                <button className="btn btn-warning fw-semibold" type="button" onClick={goCheckout}>
                  Commander
                </button>
              </div>

              <small className="text-secondary d-block mt-2">
                Paiement à la livraison ou mobile money
              </small>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
