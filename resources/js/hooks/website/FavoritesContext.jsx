import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext(null);
const LEGACY_FAVORITES_KEY = "favorites";

export function FavoritesProvider({ children }) {
  const { isAuth, user } = useAuth();
  const storageKey = useMemo(() => {
    const userId = user?.id;
    return userId ? `favorites:user:${userId}` : null;
  }, [user?.id]);

  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    localStorage.removeItem(LEGACY_FAVORITES_KEY);

    if (!isAuth || !storageKey) {
      setFavorites([]);
      return;
    }

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      setFavorites(Array.isArray(saved) ? saved : []);
    } catch {
      setFavorites([]);
    }
  }, [isAuth, storageKey]);

  useEffect(() => {
    if (!isAuth || !storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(favorites));
  }, [favorites, isAuth, storageKey]);

  const isFav = (id) => favorites.some((p) => p.id === id);

  const toggleFav = (product) => {
    if (!isAuth) return;

    setFavorites((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);

      // snapshot minimal
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
        },
      ];
    });
  };

  const removeFav = (id) => setFavorites((prev) => prev.filter((p) => p.id !== id));
  const clearFav = () => setFavorites([]);

  const favCount = useMemo(() => favorites.length, [favorites]);

  const value = { favorites, favCount, isFav, toggleFav, removeFav, clearFav };
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites doit être utilisé dans <FavoritesProvider>");
  return ctx;
}
