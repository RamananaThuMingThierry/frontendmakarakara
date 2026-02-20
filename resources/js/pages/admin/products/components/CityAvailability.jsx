import { productsApi } from "../../../../api/products";

export default function CityAvailability({ product, reload }) {
  async function toggle(cityId, current) {
    await productsApi.toggleCity(product.encrypted_id, cityId, {
      is_available: !current,
    });
    reload();
  }

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body">
        <h6>Disponibilité par ville</h6>

        <table className="table table-sm">
          <thead>
            <tr>
              <th>Ville</th>
              <th>Disponible</th>
            </tr>
          </thead>
          <tbody>
            {product.cities?.map((city) => (
              <tr key={city.id}>
                <td>{city.name}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={city.pivot?.is_available}
                    onChange={() => toggle(city.id, city.pivot?.is_available)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}