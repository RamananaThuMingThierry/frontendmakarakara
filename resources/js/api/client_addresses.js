import api from "./axios";

export async function listClientAddresses() {
  const { data } = await api.get("/my-addresses");
  return data.data ?? [];
}

export async function createClientAddress(payload) {
  const { data } = await api.post("/my-addresses", payload);
  return data;
}

export async function updateClientAddress(addressId, payload) {
  const { data } = await api.put(`/my-addresses/${addressId}`, payload);
  return data;
}

export async function deleteClientAddress(addressId) {
  const { data } = await api.delete(`/my-addresses/${addressId}`);
  return data;
}
