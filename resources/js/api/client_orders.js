import api from "./axios";

export async function listMyOrders() {
  const { data } = await api.get("/my-orders");
  return data.data ?? [];
}

export async function createOrder(payload) {
  const { data } = await api.post("/orders", payload);
  return data;
}
