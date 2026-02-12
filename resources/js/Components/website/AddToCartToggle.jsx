import { useCart } from "../../hooks/website/CartContext";

export default function AddToCartToggle({ product, variant = "full" }) {
  const { getQty, addOne, inc, dec, remove, setQty } = useCart();
  const qty = getQty(product.id);

  const isCompact = variant === "compact";

  // AVANT AJOUT
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

  // APRÈS AJOUT (contrôles)
  return (
    <div
      className={
        isCompact
          ? "d-inline-flex align-items-center gap-2 w-100"
          : "d-flex align-items-center gap-2 w-100"
      }
    >
      {/* gauche : qty=1 => poubelle, sinon '-' */}
      {qty === 1 ? (
        <button
          type="button"
          className="btn btn-outline-danger btn-sm"
          onClick={() => remove(product.id)}
          title="Supprimer"
        >
          <i className="bi bi-trash" />
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => dec(product.id)}
          title="Diminuer"
        >
          −
        </button>
      )}

      {/* input qty */}
      <input
        type="number"
        className="form-control form-control-sm text-center flex-grow-1"
        style={{ width: isCompact ? 56 : 90 }}
        value={qty}
        min={1}
        onChange={(e) => setQty(product.id, e.target.value)}
      />

      {/* plus */}
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={() => inc(product.id)}
        title="Augmenter"
      >
        +
      </button>
    </div>
  );
}
