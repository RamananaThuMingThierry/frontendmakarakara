import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/website/CartContext";

function formatPriceMGA(value) {
  return `${Number(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} MGA`;
}

export default function Checkout() {
  const { cart, cartCount, total, clear } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // infos venant du Cart (coupon/remise/livraison)
  const couponCode = location.state?.coupon_code || null;
  const discountTotal = Number(location.state?.discount_total || 0);
  const deliveryFee = Number(location.state?.delivery_fee || 0);

  const subtotal = total;

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountTotal) + deliveryFee;
  }, [subtotal, discountTotal, deliveryFee]);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city_name: "",
    region: "",
    notes: "",
    latitude: "",
    longitude: "",
    payment_method: "cash", // cash | mobile_money
  });

  const [geoLoading, setGeoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Géolocalisation non supportée sur cet appareil.");
      return;
    }

    setGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
    (pos) => {
        update("latitude", pos.coords.latitude.toFixed(7));
        update("longitude", pos.coords.longitude.toFixed(7));
        setGeoLoading(false);
    },
    (err) => {
        console.log("Geo error object:", err);
        alert(`Erreur GPS: ${err.code} - ${err.message}`);
        setGeoLoading(false);
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

  };

  const validate = () => {
    if (!cartCount) return "Votre panier est vide.";
    if (!form.full_name.trim()) return "Veuillez saisir votre nom.";
    if (!form.phone.trim()) return "Veuillez saisir votre téléphone.";
    if (!form.city_name.trim()) return "Veuillez saisir la ville.";
    if (!form.address_line1.trim()) return "Veuillez saisir l’adresse.";
    // if (!form.latitude || !form.longitude) return "Veuillez ajouter votre position GPS.";
    return null;
  };

  const submitOrder = async () => {
    const err = validate();
    if (err) return alert(err);

    setSubmitting(true);

    // ✅ Payload prêt pour Laravel /api/orders
    const payload = {
      coupon_code: couponCode,
      payment_method: form.payment_method, // cash | mobile_money
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
        product_id: i.id,
        quantity: i.qty,
      })),
    };

    try {
      // 🔁 1) Pour l’instant: MOCK
      // 🔁 2) Plus tard: fetch("/api/orders", { method:"POST", headers..., body: JSON.stringify(payload) })
      console.log("ORDER PAYLOAD", payload);

      // Simule un order_number
      const orderNumber = "ORD-" + Date.now();

      // vider panier
      clear();

      // redirect vers page récap
      navigate(`/order-success/${orderNumber}`, {
        state: {
          order_number: orderNumber,
          subtotal,
          discount_total: discountTotal,
          delivery_fee: deliveryFee,
          total: grandTotal,
          coupon_code: couponCode,
          payment_method: form.payment_method,
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
    } finally {
      setSubmitting(false);
    }
  };

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
            <h1 className="fw-bold mb-1">Livraison</h1>
            <p className="text-secondary mb-0">Remplissez vos informations pour recevoir la commande.</p>
          </div>

          <Link to="/cart" className="btn btn-outline-dark">
            Retour au panier
          </Link>
        </div>

        <div className="row g-4">
          {/* FORM */}
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
                  <label className="form-label">Téléphone *</label>
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
                  <label className="form-label">Complément (optionnel)</label>
                  <input
                    className="form-control"
                    value={form.address_line2}
                    onChange={(e) => update("address_line2", e.target.value)}
                    placeholder="Ex: étage, bâtiment..."
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Région (optionnel)</label>
                  <input
                    className="form-control"
                    value={form.region}
                    onChange={(e) => update("region", e.target.value)}
                    placeholder="Ex: Analamanga"
                  />
                </div>

                {/* GPS */}
                <div className="col-12">
                <label className="form-label">Position GPS (optionnel)</label>


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

                    {/* Bouton GPS auto */}
                    <button
                    className="btn btn-outline-dark"
                    type="button"
                    onClick={getLocation}
                    >
                    <i className="bi bi-geo-alt me-2" />
                    Utiliser ma position
                    </button>

                    {/* Fallback Google Maps */}
                    <a
                    className="btn btn-outline-secondary"
                    target="_blank"
                    rel="noreferrer"
                    href="https://www.google.com/maps"
                    >
                    <i className="bi bi-map me-2" />
                    Google Maps
                    </a>
                </div>

                <small className="text-secondary d-block mt-2">
                    Si la localisation ne marche pas, ouvrez Google Maps, appuyez longtemps
                    sur votre position et copiez la latitude / longitude.
                </small>
                </div>

                <div className="col-12">
                  <label className="form-label">Notes (optionnel)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder="Ex: Appeler avant d’arriver, repère..."
                  />
                </div>
              </div>

              <hr className="my-4" />

              <h5 className="fw-bold mb-3">Paiement</h5>

              <div className="d-flex flex-column gap-2">
                <label className="d-flex align-items-center gap-2">
                  <input
                    type="radio"
                    name="pay"
                    checked={form.payment_method === "cash"}
                    onChange={() => update("payment_method", "cash")}
                  />
                  <span>
                    <span className="fw-semibold">Espèce</span>{" "}
                    <span className="text-secondary">(payer à la livraison)</span>
                  </span>
                </label>

                <label className="d-flex align-items-center gap-2">
                  <input
                    type="radio"
                    name="pay"
                    checked={form.payment_method === "mobile_money"}
                    onChange={() => update("payment_method", "mobile_money")}
                  />
                  <span>
                    <span className="fw-semibold">Mobile money</span>{" "}
                    <span className="text-secondary">(MVola / Orange / Airtel)</span>
                  </span>
                </label>
              </div>

              <button
                className="btn btn-warning w-100 fw-semibold mt-4"
                type="button"
                onClick={submitOrder}
                disabled={submitting}
              >
                {submitting ? "Validation..." : "Valider la commande"}
              </button>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="col-12 col-lg-5">
            <div className="bg-white rounded-4 shadow-sm p-4">
              <h5 className="fw-bold mb-3">Récapitulatif</h5>

              <div className="text-secondary small mb-3">
                {cartCount} article(s)
                {couponCode ? <> • Coupon: <span className="fw-semibold">{couponCode}</span></> : null}
              </div>

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

              <hr className="my-3" />

              <div className="small text-secondary">
                <div className="fw-semibold text-dark mb-2">Produits</div>
                {cart.map((i) => (
                  <div key={i.id} className="d-flex justify-content-between mb-2">
                    <span className="text-truncate" style={{ maxWidth: 250 }}>
                      {i.name} × {i.qty}
                    </span>
                    <span className="fw-semibold">{formatPriceMGA(i.price * i.qty)}</span>
                  </div>
                ))}
              </div>

              <small className="text-secondary d-block mt-3">
                En validant, vous acceptez les conditions de vente.
              </small>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
