import { useFavorites } from "../../hooks/website/FavoritesContext";

export default function FavoriteButton({ product, className = "" }) {
  const { isFav, toggleFav } = useFavorites();
  const active = isFav(product.id);

  return (
    <button
      type="button"
      className={`btn btn-light ${className}`}
      onClick={() => toggleFav(product)}
      title={active ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <i className={`bi ${active ? "bi-heart-fill text-danger" : "bi-heart"}`} />
    </button>
  );
}
