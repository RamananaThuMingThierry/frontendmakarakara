import api from "./axios";

export const cityApi = {
  async index() {
    const { data } = await api.get("/admin/city");
    return data?.data ?? data;
  },

  async show(encryptedId) {
    const { data } = await api.get(`/admin/city/${encryptedId}`);
    return data?.data ?? data;
  },

  async create(payload) {
    const { data } = await api.post("/admin/city", payload);
    return { data: data?.data, message: data?.message };
  },

  async update(encryptedId, payload) {
    const { data } = await api.put(`/admin/city/${encryptedId}`, payload);
    return { data: data?.data, message: data?.message };
  },

  async remove(encryptedId) {
    const { data } = await api.delete(`/admin/city/${encryptedId}`);
    return { message: data?.message, data: data?.data ?? data };
  },
};