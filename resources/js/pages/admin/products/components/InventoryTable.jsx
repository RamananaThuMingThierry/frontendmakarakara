

export default function InventoryTable({ product, reload }) {
  async function adjust(cityId, type) {
    const qty = prompt("Quantité ?");
    if (!qty) return;

    await stockApi.move({
      product_id: product.encrypted_id,
      city_id: cityId,
      quantity: Number(qty),
      type: type, // IN or OUT
    });

    reload();
  }

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body">
        <h6>Inventaire</h6>

        <table className="table table-sm">
          <thead>
            <tr>
              <th>Ville</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {product.inventories?.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.city?.name}</td>
                <td>{inv.quantity}</td>
                <td className="text-end">
                  <button
                    className="btn btn-sm btn-success me-2"
                    onClick={() => adjust(inv.city_id, "IN")}
                  >
                    +
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => adjust(inv.city_id, "OUT")}
                  >
                    -
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}