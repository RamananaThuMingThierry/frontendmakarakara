import api from "./axios";

export async function listMyOrders() {
  const { data } = await api.get("/my-orders");
  return data.data ?? [];
}

export async function createOrder(payload) {
  const { data } = await api.post("/orders", payload);
  return data;
}

export async function cancelMyOrder(orderId) {
  const { data } = await api.delete(`/my-orders/${orderId}`);
  return data;
}

export async function downloadMyOrderInvoice(orderId) {
  const response = await api.get(`/my-orders/${orderId}/invoice`, {
    responseType: "blob",
  });

  return response.data;
}
