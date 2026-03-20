import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  clearMyCart,
  getMyCart,
  removeMyCartItem,
  syncMyCart,
  updateMyCartItem,
} from "../../api/client_cart";

const CartContext = createContext(null);
const CART_OWNER_KEY = "cart_owner";
const LEGACY_CART_STORAGE_KEY = "cart";

function getCartStorageKey(owner = "guest") {
  return `cart:${owner || "guest"}`;
}

function readLocalCart(owner = "guest") {
  try {
    const saved = JSON.parse(localStorage.getItem(getCartStorageKey(owner)) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function writeLocalCart(cart, owner = "guest") {
  localStorage.setItem(getCartStorageKey(owner), JSON.stringify(cart));
}

function readCartOwner() {
  return localStorage.getItem(CART_OWNER_KEY) || "guest";
}

function writeCartOwner(owner) {
  localStorage.setItem(CART_OWNER_KEY, owner || "guest");
}

function getCartItemKey(product) {
  const inventoryId = product?.inventory_id ?? null;
  const productId = product?.product_id ?? product?.id ?? null;
  const cityId = product?.city_id ?? null;

  if (inventoryId) return `inventory:${inventoryId}`;
  if (productId && cityId) return `product:${productId}:city:${cityId}`;
  if (productId) return `product:${productId}`;
  return `product:unknown:${Date.now()}`;
}

function normalizeProduct(product) {
  const productId = product.product_id ?? product.id;

  return {
    id: getCartItemKey(product),
    product_id: productId,
    inventory_id: product.inventory_id ?? null,
    city_id: product.city_id ?? null,
    city_name: product.city_name ?? null,
    name: product.name,
    price: Number(product.price || 0),
    image: product.image || null,
    qty: Math.max(1, parseInt(product.qty ?? 1, 10) || 1),
  };
}

export function CartProvider({ children }) {
  const { isAuth, hydrating, user } = useAuth();
  const [cart, setCart] = useState(() => readLocalCart(readCartOwner()));
  const [syncing, setSyncing] = useState(false);
  const hydratedUserIdRef = useRef(null);

  useEffect(() => {
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
  }, []);

  const applyLocalCart = (nextCart, owner = readCartOwner()) => {
    const normalizedCart = Array.isArray(nextCart) ? nextCart.map(normalizeProduct) : [];
    setCart(normalizedCart);
    writeLocalCart(normalizedCart, owner);
    writeCartOwner(owner);
  };

  const applyRemotePayload = (payload) => {
    const items = Array.isArray(payload?.items) ? payload.items.map(normalizeProduct) : [];
    setCart(items);
    const owner = String(user?.id ?? "auth");
    writeLocalCart(items, owner);
    writeCartOwner(owner);
  };

  useEffect(() => {
    if (hydrating) return;

    if (!isAuth) {
      hydratedUserIdRef.current = null;
      if (readCartOwner() !== "guest") {
        applyLocalCart([], "guest");
      } else {
        applyLocalCart(readLocalCart("guest"), "guest");
      }
      return;
    }

    const currentUserId = user?.id ?? "auth";
    if (hydratedUserIdRef.current === currentUserId) return;

    let cancelled = false;

    const hydrateServerCart = async () => {
      setSyncing(true);

      try {
        const localItems = readLocalCart(readCartOwner());
        const syncableItems = localItems
          .filter((item) => Number.isInteger(Number(item.product_id ?? item.id)))
          .map((item) => ({
            product_id: Number(item.product_id ?? item.id),
            quantity: Math.max(1, parseInt(item.qty ?? 1, 10) || 1),
            city_id: item.city_id ?? null,
            inventory_id: item.inventory_id ?? null,
          }));
        const shouldMergeGuestCart = readCartOwner() === "guest" && syncableItems.length > 0;

        if (shouldMergeGuestCart) {
          await syncMyCart(syncableItems);
        }

        const response = await getMyCart();
        if (cancelled) return;

        applyRemotePayload(response?.data);
        hydratedUserIdRef.current = currentUserId;
      } catch (error) {
        if (cancelled) return;
        console.error("Cart sync failed", error);
        try {
          const response = await getMyCart();
          if (cancelled) return;
          applyRemotePayload(response?.data);
          hydratedUserIdRef.current = currentUserId;
        } catch (refreshError) {
          if (cancelled) return;
          console.error("Cart refresh after sync failure failed", refreshError);
        }
      } finally {
        if (!cancelled) setSyncing(false);
      }
    };

    hydrateServerCart();

    return () => {
      cancelled = true;
    };
  }, [isAuth, hydrating, user?.id]);

  const updateServerItem = async (productId, quantity, nextLocalCart, itemMeta = null) => {
    const previousCart = cart;
    applyLocalCart(nextLocalCart, isAuth ? String(user?.id ?? "auth") : "guest");

    if (!isAuth) return { ok: true };

    setSyncing(true);

    try {
      let response;
      if (quantity <= 0) {
        response = await removeMyCartItem(productId);
      } else {
        response = await updateMyCartItem(productId, {
          quantity,
          city_id: itemMeta?.city_id ?? null,
          inventory_id: itemMeta?.inventory_id ?? null,
        });
      }

      applyRemotePayload(response?.data);
      return { ok: true, data: response?.data ?? null };
    } catch (error) {
      console.error("Cart item update failed", error);
      const message =
        error?.response?.data?.errors?.city_id?.[0] ||
        error?.response?.data?.message ||
        "Impossible de mettre a jour le panier.";

      try {
        const response = await getMyCart();
        applyRemotePayload(response?.data);
      } catch {
        applyLocalCart(previousCart, String(user?.id ?? "auth"));
      }

      return { ok: false, error: message };
    } finally {
      setSyncing(false);
    }
  };

  const getQty = (id) => cart.find((item) => item.id === id)?.qty ?? 0;

  const addOne = (product) => {
    const normalized = normalizeProduct(product);
    const nextCart = [...cart];
    const idx = nextCart.findIndex((item) => item.id === normalized.id);

    if (idx >= 0) {
      nextCart[idx] = { ...nextCart[idx], qty: (nextCart[idx].qty || 0) + 1 };
    } else {
      nextCart.push(normalized);
    }

    const nextQty = nextCart.find((item) => item.id === normalized.id)?.qty ?? 1;
    return updateServerItem(normalized.product_id, nextQty, nextCart, normalized);
  };

  const getProductKey = (productOrId) => {
    if (typeof productOrId === "object" && productOrId !== null) {
      return getCartItemKey(productOrId);
    }

    return productOrId;
  };

  const getQtyByProduct = (productOrId) => getQty(getProductKey(productOrId));

  const setQty = (id, qty) => {
    const nextQty = Math.max(0, parseInt(qty, 10) || 0);
    const current = cart.find((item) => item.id === id);
    if (!current) return Promise.resolve({ ok: false, error: "Produit introuvable dans le panier." });

    const nextCart = cart
      .map((item) => (item.id === id ? { ...item, qty: nextQty } : item))
      .filter((item) => item.qty > 0);

    return updateServerItem(current.product_id ?? current.id, nextQty, nextCart, current);
  };

  const inc = (id) => setQty(id, getQty(id) + 1);
  const dec = (id) => setQty(id, getQty(id) - 1);
  const remove = (id) => setQty(id, 0);

  const clear = async () => {
    applyLocalCart([], isAuth ? String(user?.id ?? "auth") : "guest");

    if (!isAuth) return;

    setSyncing(true);

    try {
      const response = await clearMyCart();
      applyRemotePayload(response?.data);
    } catch (error) {
      console.error("Cart clear failed", error);
    } finally {
      setSyncing(false);
    }
  };

  const clearLocal = () => {
    applyLocalCart([], isAuth ? String(user?.id ?? "auth") : "guest");
  };

  const refreshCart = async () => {
    if (!isAuth) {
      applyLocalCart(readLocalCart("guest"), "guest");
      return;
    }

    setSyncing(true);

    try {
      const response = await getMyCart();
      applyRemotePayload(response?.data);
    } catch (error) {
      console.error("Cart refresh failed", error);
    } finally {
      setSyncing(false);
    }
  };

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + (item.qty || 0), 0),
    [cart]
  );

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price || 0) * (item.qty || 0), 0),
    [cart]
  );

  const cartCityIds = useMemo(
    () =>
      Array.from(
        new Set(
          cart
            .map((item) => item.city_id)
            .filter((value) => value !== null && value !== undefined && value !== "")
            .map((value) => String(value))
        )
      ),
    [cart]
  );

  const cartCityNames = useMemo(
    () =>
      Array.from(
        new Set(
          cart
            .map((item) => item.city_name)
            .filter((value) => String(value || "").trim() !== "")
        )
      ),
    [cart]
  );

  const value = {
    cart,
    cartCount,
    total,
    cartCityIds,
    cartCityNames,
    syncing,
    getQty,
    getQtyByProduct,
    addOne,
    setQty,
    inc,
    dec,
    remove,
    clear,
    clearLocal,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit etre utilise dans <CartProvider>");
  return ctx;
}
