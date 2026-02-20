export default function StockMovements({ product }) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <h6>Mouvements de stock</h6>

        <table className="table table-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Ville</th>
              <th>Type</th>
              <th>Quantité</th>
            </tr>
          </thead>
          <tbody>
            {product.stock_movements?.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.created_at).toLocaleString()}</td>
                <td>{m.city?.name}</td>
                <td>{m.type}</td>
                <td>{m.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}