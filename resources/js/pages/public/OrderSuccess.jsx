import { useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

function formatPriceMGA(value) {
  return `${Number(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} MGA`;
}

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const data = state || null;
  const items = data?.items || [];
  const subtotal = Number(data?.subtotal || 0);
  const discountTotal = Number(data?.discount_total || 0);
  const deliveryFee = Number(data?.delivery_fee || 0);
  const total = Number(data?.total || 0);
  const couponCode = data?.coupon_code || null;
  const paymentMethod = data?.payment_method || "cash";
  const paymentMethodName = data?.payment_method_name || null;
  const paymentStatus = data?.payment_status || "unpaid";
  const orderStatus = data?.status || "pending";
  const address = data?.address || null;

  const paymentTitle = useMemo(() => {
    if (paymentMethodName) return paymentMethodName;
    if (paymentMethod === "mobile_money") return "Mobile money";
    return "Espece";
  }, [paymentMethod, paymentMethodName]);

  const paymentStatusLabel = useMemo(() => {
    const labels = {
      unpaid: "Non paye",
      pending_verification: "En attente de verification",
      paid: "Paye",
      refunded: "Rembourse",
    };

    return labels[paymentStatus] || paymentStatus;
  }, [paymentStatus]);

  const mobileMoneyNumber = "+261329790536";
  const mobileMoneyName = "MAHAKARAKARA";

  if (!data) {
    return (
      <div className="container py-5 text-center">
        <img
          src="/images/checked.png"
          alt="Commande"
          className="img-fluid mb-4"
          style={{ maxWidth: 260, opacity: 0.9 }}
        />
        <h5 className="fw-semibold">Commande créée</h5>
        <p className="text-muted">
          Référence : <span className="fw-semibold">{orderNumber}</span>
        </p>
        <p className="text-muted">
          Pour voir le détail, reconnecte-toi ou retourne à la boutique.
        </p>

        <div className="d-flex justify-content-center gap-2">
          <Link to="/shop" className="btn btn-dark">
            Continuer vos achats
          </Link>
          <button className="btn btn-outline-dark" onClick={() => navigate("/cart")}>
            Voir panier
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="py-5" style={{ background: "#fbf7ec" }}>
      <div className="container">
        <div className="text-center mb-4">
          <img
            src="/images/checked.png"
            alt="Commande validee"
            className="img-fluid mb-3"
            style={{ maxWidth: 140 }}
          />

          <h1 className="fw-bold mb-1">Votre commande est créée</h1>
          <p className="text-secondary mb-0">
            Merci. Votre commande a bien été enregistrée.
          </p>

          <div className="d-flex justify-content-center gap-2 mt-3 flex-wrap">
            <span className="badge bg-dark">Commande : {orderStatus}</span>
            <span className={`badge bg-${paymentStatus === "paid" ? "success" : paymentStatus === "pending_verification" ? "warning" : "secondary"}`}>
              Paiement : {paymentStatusLabel}
            </span>
          </div>

          <div className="mt-3">
            <span className="badge bg-dark fs-6">
              Référence : {data.order_number || orderNumber}
            </span>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4">
              <h5 className="fw-bold mb-3">Récapitulatif des articles</h5>

              {items.map((i) => (
                <div key={i.id} className="d-flex gap-3 py-3 border-bottom">
                  <img
                    src={i.image || "/images/placeholder-product.png"}
                    alt={i.name}
                    className="rounded-3 border"
                    style={{ width: 70, height: 70, objectFit: "cover" }}
                  />
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{i.name}</div>
                    <div className="text-secondary small">Quantité : {i.qty}</div>
                  </div>
                  <div className="fw-semibold text-danger">
                    {formatPriceMGA((i.price || 0) * (i.qty || 0))}
                  </div>
                </div>
              ))}

              <div className="pt-3 d-flex justify-content-between">
                <Link to="/shop" className="btn btn-outline-dark">
                  Continuer vos achats
                </Link>
                <Link to="/cart" className="btn btn-dark">
                  Retour au panier
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-4 shadow-sm p-4">
              <h5 className="fw-bold mb-3">Adresse de livraison</h5>

              {address ? (
                <>
                  <div className="mb-2">
                    <span className="text-secondary">Nom :</span>{" "}
                    <span className="fw-semibold">{address.full_name}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-secondary">Téléphone :</span>{" "}
                    <span className="fw-semibold">{address.phone}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-secondary">Ville :</span>{" "}
                    <span className="fw-semibold">{address.city_name}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-secondary">Adresse :</span>{" "}
                    <span className="fw-semibold">{address.address_line1}</span>
                    {address.address_line2 ? (
                      <span className="text-secondary"> - {address.address_line2}</span>
                    ) : null}
                  </div>
                  {address.region ? (
                    <div className="mb-2">
                      <span className="text-secondary">Région :</span>{" "}
                      <span className="fw-semibold">{address.region}</span>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="text-secondary">
                  Adresse non disponible.
                </div>
              )}
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4">
              <h5 className="fw-bold mb-3">Totaux</h5>

              {couponCode ? (
                <div className="text-secondary small mb-3">
                  Coupon applique : <span className="fw-semibold">{couponCode}</span>
                </div>
              ) : null}

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
                  {deliveryFee > 0 ? formatPriceMGA(deliveryFee) : "A confirmer par l'administration"}
                </span>
              </div>

              <hr />

              <div className="d-flex justify-content-between">
                <span className="fw-bold">Total</span>
                <span className="fw-bold text-danger">{formatPriceMGA(total)}</span>
              </div>
            </div>

            <div className="bg-white rounded-4 shadow-sm p-4">
              <h5 className="fw-bold mb-2">Paiement : {paymentTitle}</h5>

              {paymentMethod === "cash" ? (
                <div className="text-secondary">
                  <p className="mb-2">
                    Le total final à payer sera confirmé après définition du frais de livraison par l'administration.
                  </p>
                  <div className="alert alert-warning mb-0">
                    La commande reste en attente de confirmation. L'administration fixera le frais de livraison avant confirmation finale.
                  </div>
                </div>
              ) : (
                <div className="text-secondary">
                  <p className="mb-2">
                    Effectuez le paiement via mobile money, puis gardez la preuve. Le paiement ne sera valide qu'après vérification manuelle.
                  </p>

                  <div className="border rounded-3 p-3 bg-light">
                    <div className="fw-semibold text-dark">{mobileMoneyName}</div>
                    <div className="mt-1">
                      Numéro : <span className="fw-semibold">{mobileMoneyNumber}</span>
                    </div>
                    <div className="mt-1">
                      Montant : <span className="fw-semibold">{formatPriceMGA(total)}</span>
                    </div>
                    <div className="mt-1">
                      Référence : <span className="fw-semibold">{data.order_number || orderNumber}</span>
                    </div>
                  </div>

                  <small className="d-block mt-2">
                    Après paiement, notre équipe confirmera la commande puis générera le reçu.
                  </small>
                </div>
              )}

              <div className="d-grid gap-2 mt-4">
                <Link to="/shop" className="btn btn-dark">
                  Retour à la boutique
                </Link>
                <Link to="/contact" className="btn btn-outline-dark">
                  Besoin d'aide ?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
