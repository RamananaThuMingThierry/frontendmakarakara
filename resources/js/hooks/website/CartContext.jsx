import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("cart") || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  // ✅ Auto-sync localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const getQty = (id) => cart.find((i) => i.id === id)?.qty ?? 0;

  const addOne = (product) => {
    setCart((prev) => {
      const next = [...prev];
      const idx = next.findIndex((i) => i.id === product.id);

      if (idx >= 0) {
        next[idx] = { ...next[idx], qty: (next[idx].qty || 0) + 1 };
      } else {
        next.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          qty: 1,
        });
      }
      return next;
    });
  };

  const setQty = (id, qty) => {
    const q = Math.max(0, parseInt(qty, 10) || 0);

    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: q } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const inc = (id) => setQty(id, getQty(id) + 1);
  const dec = (id) => setQty(id, getQty(id) - 1);
  const remove = (id) => setQty(id, 0);
  const clear = () => setCart([]);

  const cartCount = useMemo(
    () => cart.reduce((sum, i) => sum + (i.qty || 0), 0),
    [cart]
  );

  const total = useMemo(
    () => cart.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 0), 0),
    [cart]
  );

  const value = {
    cart,
    cartCount,
    total,
    getQty,
    addOne,
    setQty,
    inc,
    dec,
    remove,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans <CartProvider>");
  return ctx;
}
