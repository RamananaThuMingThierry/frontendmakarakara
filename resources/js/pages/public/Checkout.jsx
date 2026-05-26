import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useCart } from "../../hooks/website/CartContext";
import { useAuth } from "../../hooks/website/AuthContext";
import { createOrder } from "../../api/client_orders";
import { listClientAddresses } from "../../api/client_addresses";
import { listActivePaymentMethods } from "../../api/public_payment_methods";
import { useI18n } from "../../hooks/website/I18nContext";

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

function canUseGeolocation() {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

  return Boolean(window.isSecureContext || isLocalhost);
}

export default function Checkout() {
  const { t } = useI18n();
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [paymentMethodsError, setPaymentMethodsError] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [savedAddressesLoading, setSavedAddressesLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState("");

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

    async function loadAddresses() {
      if (!isAuth) {
        setSavedAddresses([]);
        setSavedAddressesLoading(false);
        return;
      }

      setSavedAddressesLoading(true);

      try {
        const data = await listClientAddresses();
        if (!mounted) return;

        const list = Array.isArray(data) ? data : [];
        setSavedAddresses(list);

        const defaultAddress = list.find((item) => item?.is_default) || list[0] || null;
        if (defaultAddress) {
          setSelectedAddressId(String(defaultAddress.encrypted_id || defaultAddress.id));
          setForm((current) => ({
            ...current,
            full_name: defaultAddress.full_name || current.full_name,
            phone: defaultAddress.phone || current.phone,
            address_line1: defaultAddress.address_line1 || "",
            address_line2: defaultAddress.address_line2 || "",
            city_name: defaultAddress.city_name || "",
            region: defaultAddress.region || "",
            latitude: defaultAddress.latitude || "",
            longitude: defaultAddress.longitude || "",
          }));
        }
      } catch {
        if (mounted) setSavedAddresses([]);
      } finally {
        if (mounted) setSavedAddressesLoading(false);
      }
    }

    loadAddresses();

    return () => {
      mounted = false;
    };
  }, [isAuth]);

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
          error?.response?.data?.message || t("checkout.errors.loadPaymentMethods", "Unable to load payment methods.")
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
  }, [t]);

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

  const update = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((current) => {
      if (!current[k]) return current;
      const next = { ...current };
      delete next[k];
      return next;
    });
    setFormError("");
  };

  const applySavedAddress = (addressId) => {
    setSelectedAddressId(addressId);

    const address = savedAddresses.find(
      (item) => String(item.encrypted_id || item.id) === String(addressId)
    );

    if (!address) return;

    setForm((current) => ({
      ...current,
      full_name: address.full_name || current.full_name,
      phone: address.phone || current.phone,
      address_line1: address.address_line1 || "",
      address_line2: address.address_line2 || "",
      city_name: address.city_name || "",
      region: address.region || "",
      latitude: address.latitude || "",
      longitude: address.longitude || "",
    }));
  };

  const getLocation = (options = {}) => {
    if (!navigator.geolocation) {
      setGeoError(t("checkout.geo.notSupported", "Geolocation is not supported on this device."));
      return;
    }

    if (!canUseGeolocation()) {
      setGeoError(
        t(
          "checkout.geo.secureRequired",
          "Browser geolocation requires a secure connection. Use HTTPS or localhost, or enter latitude and longitude manually."
        )
      );
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
          const message = String(err?.message || "");
          const secureContextError = message.toLowerCase().includes("only secure origins are allowed");

          setGeoError(
            secureContextError
              ? t(
                  "checkout.geo.secureRequiredShort",
                  "Browser geolocation requires HTTPS or localhost. Use a secure connection, or enter latitude and longitude manually."
                )
              : t("checkout.geo.unablePosition", "Unable to retrieve your position ({{message}}).").replace("{{message}}", message)
          );
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
        if (!navigator.geolocation || !canUseGeolocation()) return;

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
    const nextErrors = {};

    if (!form.full_name.trim()) nextErrors.full_name = t("checkout.errors.nameRequired", "Please enter your name.");
    if (!form.phone.trim()) nextErrors.phone = t("checkout.errors.phoneRequired", "Please enter your phone number.");
    if (!form.city_name.trim()) nextErrors.city_name = t("checkout.errors.cityRequired", "Please enter the city.");
    if (!form.address_line1.trim()) nextErrors.address_line1 = t("checkout.errors.addressRequired", "Please enter the address.");
    if (!form.payment_method) nextErrors.payment_method = t("checkout.errors.paymentRequired", "Please choose a payment method.");

    if (!cartCount) {
      return {
        form: t("checkout.errors.emptyCart", "Your cart is empty."),
        fields: nextErrors,
      };
    }

    if (!activePaymentMethods.length) {
      return {
        form: t("checkout.errors.noPaymentMethods", "No active payment method is available at the moment."),
        fields: nextErrors,
      };
    }

    return {
      form: "",
      fields: nextErrors,
    };
  };

  const submitOrder = async () => {
    const validation = validate();
    setFieldErrors(validation.fields);
    setFormError(validation.form);

    if (validation.form || Object.keys(validation.fields).length > 0) return;

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
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
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
      const apiErrors = error?.response?.data?.errors || {};

      setFieldErrors((current) => ({
        ...current,
        full_name: apiErrors["address.full_name"]?.[0] || current.full_name,
        phone: apiErrors["address.phone"]?.[0] || current.phone,
        city_name: apiErrors["address.city_name"]?.[0] || current.city_name,
        address_line1: apiErrors["address.address_line1"]?.[0] || current.address_line1,
        payment_method: apiErrors.payment_method_id?.[0] || current.payment_method,
      }));
      setFormError(error?.response?.data?.message || t("checkout.errors.createOrder", "Unable to create the order."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuth) {
    return <Navigate to="/login" replace state={{ from: location, message: t("checkout.loginRequired", "Sign in before ordering.") }} />;
  }

  const selectedPaymentMethod = activePaymentMethods.find(
    (method) => String(method.id) === String(form.payment_method)
  );

  const paymentHelpText =
    inferPaymentKind(selectedPaymentMethod) === "mobile_money"
      ? t(
          "checkout.payment.mobileMoneyHelp",
          "Choosing Mobile Money does not validate the payment. The order will be created with payment pending verification."
        )
      : t(
          "checkout.payment.cashHelp",
          "Choosing cash creates an unpaid order. Payment will be confirmed later."
        );

  if (!cartCount) {
    return (
      <div className="container py-5 text-center">
        <img
          src="/images/shopping-cart.png"
          alt={t("checkout.empty.alt", "Empty cart")}
          className="img-fluid mb-4"
          style={{ maxWidth: 260, opacity: 0.9 }}
        />
        <h5 className="fw-semibold">{t("checkout.empty.title", "Your cart is empty")}</h5>
        <p className="text-muted">{t("checkout.empty.subtitle", "Add products to place an order.")}</p>
        <Link to="/shop" className="btn btn-dark">
          {t("checkout.actions.goShop", "Go to shop")}
        </Link>
      </div>
    );
  }

  return (
    <main className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
          <div>
            <h1 className="fw-bold mb-1">{t("checkout.title", "Delivery")}</h1>
            <p className="text-secondary mb-0">
              {t("checkout.subtitle", "Fill in your information and share your location to make delivery easier.")}
            </p>
          </div>

          <Link to="/cart" className="btn btn-outline-dark">
            {t("checkout.actions.backToCart", "Back to cart")}
          </Link>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="bg-white rounded-4 shadow-sm p-4">
              <h5 className="fw-bold mb-3">{t("checkout.sections.customerInfo", "Customer information")}</h5>

              {formError ? <div className="alert alert-danger py-2">{formError}</div> : null}

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">{t("checkout.fields.fullName", "Full name")} *</label>
                  {fieldErrors.full_name ? <span className="text-danger small d-block mb-1">{fieldErrors.full_name}</span> : null}
                  <input
                    className={`form-control ${fieldErrors.full_name ? "is-invalid" : ""}`}
                    value={form.full_name}
                    onChange={(e) => update("full_name", e.target.value)}
                    placeholder={t("checkout.placeholders.fullName", "Ex: RAKOTO Jean")}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">{t("checkout.fields.phone", "Phone")} *</label>
                  {fieldErrors.phone ? <span className="text-danger small d-block mb-1">{fieldErrors.phone}</span> : null}
                  <input
                    className={`form-control ${fieldErrors.phone ? "is-invalid" : ""}`}
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder={t("checkout.placeholders.phone", "Ex: 034 12 345 67")}
                    required
                  />
                </div>
              </div>

              <hr className="my-4" />

              <h5 className="fw-bold mb-3">{t("checkout.sections.deliveryAddress", "Delivery address")}</h5>

              <div className="mb-3">
                <label className="form-label">{t("checkout.fields.savedAddress", "Saved address")}</label>
                <select
                  className="form-select"
                  value={selectedAddressId}
                  onChange={(e) => applySavedAddress(e.target.value)}
                  disabled={savedAddressesLoading || !savedAddresses.length}
                >
                  <option value="">
                    {savedAddressesLoading
                      ? t("checkout.address.loading", "Loading addresses...")
                      : savedAddresses.length
                        ? t("checkout.address.chooseSaved", "Choose a saved address")
                        : t("checkout.address.noneSaved", "No saved address")}
                  </option>
                  {savedAddresses.map((address) => (
                    <option key={address.id} value={String(address.encrypted_id || address.id)}>
                      {address.label || address.city_name || t("checkout.address.fallback", "Address")}
                      {address.is_default ? ` - ${t("checkout.address.default", "Default")}` : ""}
                    </option>
                  ))}
                </select>
                {savedAddresses.length ? (
                  <small className="text-secondary d-block mt-2">
                    {t("checkout.address.manageHint", "You can manage your addresses from your client space.")}
                  </small>
                ) : null}
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">{t("checkout.fields.city", "City")} *</label>
                  {fieldErrors.city_name ? <span className="text-danger small d-block mb-1">{fieldErrors.city_name}</span> : null}
                  <input
                    className={`form-control ${fieldErrors.city_name ? "is-invalid" : ""}`}
                    value={form.city_name}
                    onChange={(e) => update("city_name", e.target.value)}
                    placeholder={t("checkout.placeholders.city", "Ex: Antananarivo")}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">{t("checkout.fields.address", "Address")} *</label>
                  {fieldErrors.address_line1 ? <span className="text-danger small d-block mb-1">{fieldErrors.address_line1}</span> : null}
                  <input
                    className={`form-control ${fieldErrors.address_line1 ? "is-invalid" : ""}`}
                    value={form.address_line1}
                    onChange={(e) => update("address_line1", e.target.value)}
                    placeholder={t("checkout.placeholders.address", "District, street, lot...")}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">{t("checkout.fields.address2", "Additional details (optional)")}</label>
                  <input
                    className="form-control"
                    value={form.address_line2}
                    onChange={(e) => update("address_line2", e.target.value)}
                    placeholder={t("checkout.placeholders.address2", "Ex: floor, building...")}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">{t("checkout.fields.region", "Region (optional)")}</label>
                  <input
                    className="form-control"
                    value={form.region}
                    onChange={(e) => update("region", e.target.value)}
                    placeholder={t("checkout.placeholders.region", "Ex: Analamanga")}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">{t("checkout.fields.gps", "GPS position (optional)")}</label>

                  <div className="d-flex flex-column flex-md-row gap-2">
                    <input
                      className="form-control"
                      placeholder={t("checkout.fields.latitude", "Latitude")}
                      value={form.latitude}
                      onChange={(e) => update("latitude", e.target.value)}
                    />

                    <input
                      className="form-control"
                      placeholder={t("checkout.fields.longitude", "Longitude")}
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
                      {geoLoading ? t("checkout.actions.locating", "Locating...") : t("checkout.actions.useMyPosition", "Use my position")}
                    </button>

                    <a
                      className="btn btn-outline-secondary"
                      target="_blank"
                      rel="noreferrer"
                      href={
                        form.latitude && form.longitude
                          ? `https://www.google.com/maps?q=${form.latitude},${form.longitude}`
                          : "https://www.google.com/maps"
                      }
                    >
                      <i className="bi bi-map me-2" />
                      {t("checkout.actions.map", "Map")}
                    </a>
                  </div>

                  {geoError ? <div className="alert alert-warning mt-3 mb-0 py-2">{geoError}</div> : null}

                  {form.latitude && form.longitude ? (
                    <div className="alert alert-success mt-3 mb-0 py-2">
                      {t("checkout.geo.savedPosition", "Saved position")} : {form.latitude}, {form.longitude}
                      {geoMeta?.accuracy ? ` - ${t("checkout.geo.accuracy", "accuracy about")} ${geoMeta.accuracy} m` : ""}
                      {geoMeta?.capturedAt ? ` - ${t("checkout.geo.capturedAt", "recorded at")} ${geoMeta.capturedAt}` : ""}
                    </div>
                  ) : (
                    <small className="text-secondary d-block mt-2">
                      {t(
                        "checkout.geo.help",
                        "Allow geolocation to speed up delivery. If needed, you can also paste latitude and longitude manually. Automatic detection works on HTTPS or localhost. You can validate the order even without a GPS position."
                      )}
                    </small>
                  )}
                </div>

                <div className="col-12">
                  <label className="form-label">{t("checkout.fields.notes", "Notes (optional)")}</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder={t("checkout.placeholders.notes", "Ex: Call before arriving, landmark, blue gate...")}
                  />
                </div>
              </div>

              <hr className="my-4" />

              <h5 className="fw-bold mb-3">{t("checkout.sections.payment", "Payment")}</h5>

              {paymentMethodsLoading ? (
                <div className="text-secondary small">{t("checkout.payment.loading", "Loading payment methods...")}</div>
              ) : activePaymentMethods.length ? (
                <>
                  {fieldErrors.payment_method ? (
                    <span className="text-danger small d-block mb-2">{fieldErrors.payment_method}</span>
                  ) : null}
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
                                {isMobileMoney
                                  ? t("checkout.payment.pendingVerification", "(payment pending verification)")
                                  : t("checkout.payment.payOnDelivery", "(pay on delivery)")}
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
                  {paymentMethodsError || t("checkout.errors.noPaymentMethods", "No active payment method is available at the moment.")}
                </div>
              )}

              <button
                className="btn btn-warning w-100 fw-semibold mt-4"
                type="button"
                onClick={submitOrder}
                disabled={submitting || geoLoading || paymentMethodsLoading || !activePaymentMethods.length}
              >
                {submitting ? t("checkout.actions.validating", "Validating...") : t("checkout.actions.submit", "Validate order")}
              </button>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="bg-white rounded-4 shadow-sm p-4">
              <h5 className="fw-bold mb-3">{t("checkout.summary.title", "Summary")}</h5>

              <div className="text-secondary small mb-3">
                {t("checkout.summary.count", "{{count}} item(s)").replace("{{count}}", cartCount)}
                {couponCode ? (
                  <>
                    {" "}
                    - {t("checkout.summary.coupon", "Coupon")}: <span className="fw-semibold">{couponCode}</span>
                  </>
                ) : null}
              </div>

              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>{t("checkout.summary.subtotal", "Subtotal")}</span>
                <span className="fw-semibold">{formatPriceMGA(subtotal)}</span>
              </div>

              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>{t("checkout.summary.discount", "Discount")}</span>
                <span className="fw-semibold">{discountTotal > 0 ? `- ${formatPriceMGA(discountTotal)}` : "-"}</span>
              </div>

              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>{t("checkout.summary.delivery", "Delivery")}</span>
                <span className="fw-semibold">{t("checkout.summary.deliveryPending", "To be confirmed by the administration")}</span>
              </div>

              <hr />

              <div className="d-flex justify-content-between">
                <span className="fw-bold">{t("checkout.summary.total", "Estimated total")}</span>
                <span className="fw-bold text-danger">{formatPriceMGA(grandTotal)}</span>
              </div>

              <hr className="my-3" />

              <div className="small text-secondary">
                <div className="fw-semibold text-dark mb-2">{t("checkout.summary.products", "Products")}</div>
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
                {t(
                  "checkout.summary.footer",
                  "By validating, you accept the terms of sale. The delivery fee will be set by the administration based on distance and may be free."
                )}
              </small>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
