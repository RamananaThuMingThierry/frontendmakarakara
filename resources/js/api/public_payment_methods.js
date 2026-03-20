import api from "./axios";

export async function listActivePaymentMethods() {
  const { data } = await api.get("/payment-methods/active");
  return data.data ?? [];
}
