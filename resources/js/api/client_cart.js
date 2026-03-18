import api from "./axios";

export async function getMyCart() {
  const { data } = await api.get("/my-cart");
  return data;
}

export async function syncMyCart(items) {
  const { data } = await api.post("/my-cart/sync", { items });
  return data;
}

export async function updateMyCartItem(productId, payload) {
  const { data } = await api.put(`/my-cart/items/${productId}`, payload);
  return data;
}

export async function removeMyCartItem(productId) {
  const { data } = await api.delete(`/my-cart/items/${productId}`);
  return data;
}

export async function clearMyCart() {
  const { data } = await api.delete("/my-cart");
  return data;
}
