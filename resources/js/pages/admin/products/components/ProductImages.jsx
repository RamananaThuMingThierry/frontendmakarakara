const DEFAULT_IMG = "/images/default-product.png";

function getMain(product) {
  const img = product?.images?.[0];
  return img?.full_url || (img?.url ? `/${img.url}` : DEFAULT_IMG);
}

export default function ProductImages({ product }) {
  return (
    <div className="card">
      <div className="card-body">
        <img
          src={getMain(product)}
          className="w-100 rounded"
          style={{ height: 300, objectFit: "cover" }}
          onError={(e) => e.currentTarget.src = DEFAULT_IMG}
        />
      </div>
    </div>
  );
}