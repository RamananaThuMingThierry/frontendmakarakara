import { useMemo, useState } from "react";
import { useCart } from "../../hooks/website/CartContext";

function getLocalProductKey(product) {
  if (product?.inventory_id) return `inventory:${product.inventory_id}`;
  if (product?.product_id && product?.city_id) return `product:${product.product_id}:city:${product.city_id}`;
  if (product?.product_id) return `product:${product.product_id}`;
  return product?.id;
}

export default function AddToCartToggle({ product, variant = "full" }) {
  const { cart, cartCityNames, getQtyByProduct, addOne, inc, dec, remove, setQty } = useCart();
  const productKey = getLocalProductKey(product);
  const qty = getQtyByProduct(product);
  const [showCityModal, setShowCityModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isCompact = variant === "compact";
  const conflictItem = useMemo(() => {
    if (!product?.city_id) return null;

    return cart.find(
      (item) =>
        item.city_id &&
        String(item.city_id) !== String(product.city_id)
    ) || null;
  }, [cart, product?.city_id]);

  const handleAdd = async () => {
    setErrorMessage("");

    if (conflictItem) {
      setShowCityModal(true);
      return;
    }

    setSubmitting(true);
    const result = await addOne(product);
    setSubmitting(false);

    if (result?.ok === false) {
      setErrorMessage(result.error || "Impossible d'ajouter ce produit au panier.");
    }
  };

  if (qty === 0) {
    return (
      <>
        <button
          type="button"
          className={
            isCompact ? "btn btn-dark btn-sm w-100" : "btn btn-dark w-100 fw-semibold"
          }
          onClick={handleAdd}
          disabled={submitting}
        >
          <i className="bi bi-bag me-2" />
          {submitting ? "Ajout..." : "Ajouter"}
        </button>

        {errorMessage ? <div className="text-danger small mt-2">{errorMessage}</div> : null}

        {showCityModal ? (
          <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,0.45)" }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Commande par ville</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCityModal(false)} />
                </div>

                <div className="modal-body">
                  <div className="alert alert-warning mb-3">
                    Pour eviter les erreurs de livraison, une commande doit contenir les produits d'une seule ville.
                  </div>

                  <p className="mb-2">
                    Votre panier contient deja des produits de{" "}
                    <strong>{cartCityNames.join(", ") || conflictItem?.city_name || "cette ville"}</strong>.
                  </p>

                  <p className="mb-0">
                    Pour acheter <strong>{product?.name || "ce produit"}</strong> a{" "}
                    <strong>{product?.city_name || "cette autre ville"}</strong>, finalisez d'abord la commande actuelle
                    ou videz le panier puis creez une nouvelle commande.
                  </p>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCityModal(false)}>
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div
      className={
        isCompact
          ? "d-inline-flex align-items-center gap-2 w-100"
          : "d-flex align-items-center gap-2 w-100"
      }
    >
      {qty === 1 ? (
        <button
          type="button"
          className="btn btn-outline-danger btn-sm"
          onClick={() => remove(productKey)}
          title="Supprimer"
        >
          <i className="bi bi-trash" />
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => dec(productKey)}
          title="Diminuer"
        >
          -
        </button>
      )}

      <input
        type="number"
        className="form-control form-control-sm text-center flex-grow-1"
        style={{ width: isCompact ? 56 : 90 }}
        value={qty}
        min={1}
        onChange={async (e) => {
          setErrorMessage("");
          const result = await setQty(productKey, e.target.value);
          if (result?.ok === false) {
            setErrorMessage(result.error || "Impossible de mettre a jour la quantite.");
          }
        }}
      />

      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={async () => {
          setErrorMessage("");
          const result = await inc(productKey);
          if (result?.ok === false) {
            setErrorMessage(result.error || "Impossible d'augmenter la quantite.");
          }
        }}
        title="Augmenter"
      >
        +
      </button>

      {errorMessage ? <div className="text-danger small w-100 mt-2">{errorMessage}</div> : null}
    </div>
  );
}
