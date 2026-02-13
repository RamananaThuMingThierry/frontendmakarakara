import api from "./axios";

export async function getBrands(params = {}) {
  const { data } = await api.get("/brands", { params });
  return data;
}

export async function createBrand(payload) {
  const { data } = await api.post("/brands", payload);
  return data;
}

export async function updateBrand(id, payload) {
  const { data } = await api.put(`/brands/${id}`, payload);
  return data;
}

export async function deleteBrand(id) {
  const { data } = await api.delete(`/brands/${id}`);
  return data;
}
