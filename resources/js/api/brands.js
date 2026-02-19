import api from "./axios";

export const brandsApi = {
  async list() {
    const res = await api.get("/admin/brands");
    return res.data.data ?? res.data;
  },

  async create(payload) {
    const isFD = payload instanceof FormData;
    const res = await api.post("/admin/brands", payload, {
      headers: isFD ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return { data: res.data.data ?? res.data, message: res.data.message };
  },

  async update(id, payload) {
    const isFD = payload instanceof FormData;
    const res = await api.post(`/admin/brands/${id}`, payload, {
      headers: isFD ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return { data: res.data.data ?? res.data, message: res.data.message };
  },

  async remove(id) {
    const res = await api.delete(`/admin/brands/${id}`);
    return { message: res.data.message };
  }
};
