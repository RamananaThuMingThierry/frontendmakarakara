import { useFavorites } from "../../hooks/website/FavoritesContext";
import { useAuth } from "../../hooks/website/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

export default function FavoriteButton({ product, className = "" }) {
  const { isFav, toggleFav } = useFavorites();
  const { isAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const active = isFav(product.id);

  return (
    <button
      type="button"
      className={`btn btn-light ${className}`}
      onClick={() => {
        if (!isAuth) {
          navigate("/login", {
            state: {
              from: location,
              message: "Créez un compte ou connectez-vous avant d'ajouter un favori.",
            },
          });
          return;
        }
        toggleFav(product);
      }}
      title={active ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <i className={`bi ${active ? "bi-heart-fill text-danger" : "bi-heart"}`} />
    </button>
  );
}
