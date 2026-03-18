import { useCart } from "../../hooks/website/CartContext";

export default function AddToCartToggle({ product, variant = "full" }) {
  const { getQtyByProduct, addOne, inc, dec, remove, setQty } = useCart();
  const productKey = product.product_id ?? product.id;
  const qty = getQtyByProduct(product);

  const isCompact = variant === "compact";

  if (qty === 0) {
    return (
      <button
        type="button"
        className={
          isCompact ? "btn btn-dark btn-sm w-100" : "btn btn-dark w-100 fw-semibold"
        }
        onClick={() => addOne(product)}
      >
        <i className="bi bi-bag me-2" />
        Ajouter
      </button>
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
        onChange={(e) => setQty(productKey, e.target.value)}
      />

      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={() => inc(productKey)}
        title="Augmenter"
      >
        +
      </button>
    </div>
  );
}
