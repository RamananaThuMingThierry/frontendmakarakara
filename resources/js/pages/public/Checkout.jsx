import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useCart } from "../../hooks/website/CartContext";
import { useAuth } from "../../hooks/website/AuthContext";
import { createOrder } from "../../api/client_orders";
import { listActivePaymentMethods } from "../../api/public_payment_methods";

function formatPriceMGA(value) {
  return `${Number(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} MGA`;
}

function inferPaymentKind(method) {
  const signature = `${method?.code || ""} ${method?.name || ""}`.toLowerCase();

  return ["cash", "espece", "livraison", "cod", "contre remboursement"].some((hint) =>
    signature.includes(hint)
  )
    ? "cash"
    : "mobile_money";
}

export default function Checkout() {
  const { cart, cartCount, total, clear } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuth, user } = useAuth();

  const couponCode = location.state?.coupon_code || null;
  const discountTotal = Number(location.state?.discount_total || 0);
  const deliveryFee = Number(location.state?.delivery_fee || 0);

  const subtotal = total;

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountTotal) + deliveryFee;
  }, [subtotal, discountTotal, deliveryFee]);

  const [form, setForm] = useState({
    full_name: user?.name || "",
    phone: user?.phone || "",
    address_line1: "",
    address_line2: "",
    city_name: "",
    region: "",
    notes: "",
    latitude: "",
    longitude: "",
    payment_method: "",
  });

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [geoMeta, setGeoMeta] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [paymentMethodsError, setPaymentMethodsError] = useState("");

  const activePaymentMethods = useMemo(
    () => paymentMethods.filter((method) => method?.is_active),
    [paymentMethods]
  );

  useEffect(() => {
    setForm((current) => ({
      ...current,
      full_name: user?.name || current.full_name,
      phone: user?.phone || current.phone,
    }));
  }, [user?.name, user?.phone]);

  useEffect(() => {
    let mounted = true;

    const loadPaymentMethods = async () => {
      setPaymentMethodsLoading(true);
      setPaymentMethodsError("");

      try {
        const data = await listActivePaymentMethods();
        if (!mounted) return;
        setPaymentMethods(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!mounted) return;
        setPaymentMethods([]);
        setPaymentMethodsError(
          error?.response?.data?.message || "Impossible de charger les moyens de paiement."
        );
      } finally {
        if (mounted) {
          setPaymentMethodsLoading(false);
        }
      }
    };

    loadPaymentMethods();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (paymentMethodsLoading) return;

    setForm((current) => {
      const hasCurrent = activePaymentMethods.some(
        (method) => String(method.id) === String(current.payment_method)
      );
      if (hasCurrent) return current;

      return {
        ...current,
        payment_method: activePaymentMethods[0]?.id ? String(activePaymentMethods[0].id) : "",
      };
    });
  }, [paymentMethodsLoading, activePaymentMethods]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const getLocation = (options = {}) => {
    if (!navigator.geolocation) {
      setGeoError("La geolocalisation n'est pas supportee sur cet appareil.");
      return;
    }

    setGeoLoading(true);
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update("latitude", pos.coords.latitude.toFixed(7));
        update("longitude", pos.coords.longitude.toFixed(7));
        setGeoMeta({
          accuracy: Math.round(pos.coords.accuracy || 0),
          capturedAt: new Date().toLocaleTimeString("fr-FR"),
        });
        setGeoLoading(false);
      },
      (err) => {
        if (!options.silent) {
          setGeoError(`Impossible de recuperer votre position (${err.message}).`);
        }
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (!isAuth || form.latitude || form.longitude) return;

    const autoDetect = async () => {
      try {
        if (!navigator.geolocation) return;

        if (!navigator.permissions?.query) {
          getLocation({ silent: true });
          return;
        }

        const status = await navigator.permissions.query({ name: "geolocation" });
        if (status.state === "granted" || status.state === "prompt") {
          getLocation({ silent: status.state === "granted" });
        }
      } catch {
        // ignore permissions API failures and keep manual button available
      }
    };

    autoDetect();
  }, [form.latitude, form.longitude, isAuth]);

  const validate = () => {
    if (!cartCount) return "Votre panier est vide.";
    if (!form.full_name.trim()) return "Veuillez saisir votre nom.";
    if (!form.phone.trim()) return "Veuillez saisir votre telephone.";
    if (!form.city_name.trim()) return "Veuillez saisir la ville.";
    if (!form.address_line1.trim()) return "Veuillez saisir l'adresse.";
    if (!activePaymentMethods.length) return "Aucun moyen de paiement actif n'est disponible pour le moment.";
    if (!form.payment_method) return "Veuillez choisir un moyen de paiement.";
    if (!form.latitude || !form.longitude) {
      return "Veuillez autoriser la localisation ou renseigner votre latitude et longitude avant de valider.";
    }
    return null;
  };

  const submitOrder = async () => {
    const err = validate();
    if (err) return alert(err);

    setSubmitting(true);

    const selectedPaymentMethod = activePaymentMethods.find(
      (method) => String(method.id) === String(form.payment_method)
    );

    const payload = {
      coupon_code: couponCode,
      payment_method_id: Number(form.payment_method),
      notes: form.notes || null,
      address: {
        full_name: form.full_name,
        phone: form.phone,
        address_line1: form.address_line1,
        address_line2: form.address_line2 || null,
        city_name: form.city_name,
        region: form.region || null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      },
      items: cart.map((i) => ({
        product_id: i.product_id ?? i.id,
        quantity: i.qty,
      })),
    };

    try {
      const response = await createOrder(payload);
      const order = response?.data || null;
      const orderNumber = order?.order_number || "ORD-" + Date.now();

      clear();

      navigate(`/order-success/${orderNumber}`, {
        state: {
          order_number: orderNumber,
          subtotal,
          discount_total: discountTotal,
          delivery_fee: deliveryFee,
          total: grandTotal,
          coupon_code: couponCode,
          payment_method: order?.payment_method || inferPaymentKind(selectedPaymentMethod),
          payment_method_name: order?.paymentMethod?.name || selectedPaymentMethod?.name || "",
          status: order?.status || "pending",
          payment_status:
            order?.payment_status ||
            (inferPaymentKind(selectedPaymentMethod) === "mobile_money" ? "pending_verification" : "unpaid"),
          address: {
            full_name: form.full_name,
            phone: form.phone,
            address_line1: form.address_line1,
            address_line2: form.address_line2,
            city_name: form.city_name,
            region: form.region,
            latitude: form.latitude,
            longitude: form.longitude,
          },
          items: cart,
        },
      });
    } catch (error) {
      alert(error?.response?.data?.message || "Impossible de creer la commande.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuth) {
    return <Navigate to="/login" replace state={{ from: location, message: "Connectez-vous avant de commander." }} />;
  }

  const selectedPaymentMethod = activePaymentMethods.find(
    (method) => String(method.id) === String(form.payment_method)
  );

  const paymentHelpText = inferPaymentKind(selectedPaymentMethod) === "mobile_money"
    ? "Le choix Mobile Money ne valide pas le paiement. La commande sera creee avec un paiement en attente de verification."
    : "Le choix espece cree une commande non payee. Le paiement sera confirme ulterieurement.";

  if (!cartCount) {
    return (
      <div className="container py-5 text-center">
        <img
          src="/images/shopping-cart.png"
          alt="Panier vide"
          className="img-fluid mb-4"
          style={{ maxWidth: 260, opacity: 0.9 }}
        />
        <h5 className="fw-semibold">Votre panier est vide</h5>
        <p className="text-muted">Ajoutez des produits pour passer commande.</p>
        <Link to="/shop" className="btn btn-dark">
          Aller a la boutique
        </Link>
      </div>
    );
  }

  return (
    <main className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
          <div>
            <h1 className="fw-bold mb-1">Livraison</h1>
            <p className="text-secondary mb-0">
              Remplissez vos informations et partagez votre position pour faciliter la livraison.
            </p>
          </div>

          <Link to="/cart" className="btn btn-outline-dark">
            Retour au panier
          </Link>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="bg-white rounded-4 shadow-sm p-4">
              <h5 className="fw-bold mb-3">Informations client</h5>

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Nom complet *</label>
                  <input
                    className="form-control"
                    value={form.full_name}
                    onChange={(e) => update("full_name", e.target.value)}
                    placeholder="Ex: RAKOTO Jean"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Telephone *</label>
                  <input
                    className="form-control"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="Ex: 034 12 345 67"
                  />
                </div>
              </div>

              <hr className="my-4" />

              <h5 className="fw-bold mb-3">Adresse de livraison</h5>

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Ville *</label>
                  <input
                    className="form-control"
                    value={form.city_name}
                    onChange={(e) => update("city_name", e.target.value)}
                    placeholder="Ex: Antananarivo"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Adresse *</label>
                  <input
                    className="form-control"
                    value={form.address_line1}
                    onChange={(e) => update("address_line1", e.target.value)}
                    placeholder="Quartier, rue, lot..."
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Complement (optionnel)</label>
                  <input
                    className="form-control"
                    value={form.address_line2}
                    onChange={(e) => update("address_line2", e.target.value)}
                    placeholder="Ex: etage, batiment..."
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Region (optionnel)</label>
                  <input
                    className="form-control"
                    value={form.region}
                    onChange={(e) => update("region", e.target.value)}
                    placeholder="Ex: Analamanga"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Position GPS *</label>

                  <div className="d-flex flex-column flex-md-row gap-2">
                    <input
                      className="form-control"
                      placeholder="Latitude"
                      value={form.latitude}
                      onChange={(e) => update("latitude", e.target.value)}
                    />

                    <input
                      className="form-control"
                      placeholder="Longitude"
                      value={form.longitude}
                      onChange={(e) => update("longitude", e.target.value)}
                    />

                    <button
                      className="btn btn-outline-dark"
                      type="button"
                      onClick={() => getLocation()}
                      disabled={geoLoading}
                    >
                      <i className="bi bi-geo-alt me-2" />
                      {geoLoading ? "Localisation..." : "Utiliser ma position"}
                    </button>

                    <a
                      className="btn btn-outline-secondary"
                      target="_blank"
                      rel="noreferrer"
                      href={form.latitude && form.longitude
                        ? `https://www.google.com/maps?q=${form.latitude},${form.longitude}`
                        : "https://www.google.com/maps"}
                    >
                      <i className="bi bi-map me-2" />
                      Carte
                    </a>
                  </div>

                  {geoError ? <div className="alert alert-warning mt-3 mb-0 py-2">{geoError}</div> : null}

                  {form.latitude && form.longitude ? (
                    <div className="alert alert-success mt-3 mb-0 py-2">
                      Position enregistree : {form.latitude}, {form.longitude}
                      {geoMeta?.accuracy ? ` - precision env. ${geoMeta.accuracy} m` : ""}
                      {geoMeta?.capturedAt ? ` - relevee a ${geoMeta.capturedAt}` : ""}
                    </div>
                  ) : (
                    <small className="text-secondary d-block mt-2">
                      Autorisez la geolocalisation pour accelerer la livraison. Si besoin, vous pouvez aussi coller
                      manuellement la latitude et la longitude.
                    </small>
                  )}
                </div>

                <div className="col-12">
                  <label className="form-label">Notes (optionnel)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder="Ex: Appeler avant d'arriver, repere, portail bleu..."
                  />
                </div>
              </div>

              <hr className="my-4" />

              <h5 className="fw-bold mb-3">Paiement</h5>

              {paymentMethodsLoading ? (
                <div className="text-secondary small">Chargement des moyens de paiement...</div>
              ) : activePaymentMethods.length ? (
                <>
                  <div className="d-flex flex-column gap-2">
                    {activePaymentMethods.map((method) => {
                      const isMobileMoney = inferPaymentKind(method) === "mobile_money";

                      return (
                        <label key={method.id ?? method.code} className="d-flex align-items-center gap-2">
                          <input
                            type="radio"
                            name="pay"
                            checked={String(form.payment_method) === String(method.id)}
                            onChange={() => update("payment_method", String(method.id))}
                          />
                          <span className="d-flex align-items-center gap-2">
                            {method.image ? (
                              <img
                                src={`/${String(method.image).replace(/^\/+/, "")}`}
                                alt={method.name}
                                width="32"
                                height="32"
                                className="rounded-circle border object-fit-cover"
                              />
                            ) : null}
                            <span>
                              <span className="fw-semibold">{method.name}</span>{" "}
                              <span className="text-secondary">
                                {isMobileMoney ? "(paiement en attente de verification)" : "(payer a la livraison)"}
                              </span>
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="alert alert-info mt-3 mb-0">{paymentHelpText}</div>
                </>
              ) : (
                <div className="alert alert-warning mb-0">
                  {paymentMethodsError || "Aucun moyen de paiement actif n'est disponible pour le moment."}
                </div>
              )}

              <button
                className="btn btn-warning w-100 fw-semibold mt-4"
                type="button"
                onClick={submitOrder}
                disabled={submitting || geoLoading || paymentMethodsLoading || !activePaymentMethods.length}
              >
                {submitting ? "Validation..." : "Valider la commande"}
              </button>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="bg-white rounded-4 shadow-sm p-4">
              <h5 className="fw-bold mb-3">Recapitulatif</h5>

              <div className="text-secondary small mb-3">
                {cartCount} article(s)
                {couponCode ? <> - Coupon: <span className="fw-semibold">{couponCode}</span></> : null}
              </div>

              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>Sous-total</span>
                <span className="fw-semibold">{formatPriceMGA(subtotal)}</span>
              </div>

              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>Remise</span>
                <span className="fw-semibold">
                  {discountTotal > 0 ? `- ${formatPriceMGA(discountTotal)}` : "-"}
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

              <hr className="my-3" />

              <div className="small text-secondary">
                <div className="fw-semibold text-dark mb-2">Produits</div>
                {cart.map((i) => (
                  <div key={i.id} className="d-flex justify-content-between mb-2">
                    <span className="text-truncate" style={{ maxWidth: 250 }}>
                      {i.name} x {i.qty}
                    </span>
                    <span className="fw-semibold">{formatPriceMGA(i.price * i.qty)}</span>
                  </div>
                ))}
              </div>

              <small className="text-secondary d-block mt-3">
                En validant, vous acceptez les conditions de vente et le partage de votre position pour la livraison.
              </small>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
