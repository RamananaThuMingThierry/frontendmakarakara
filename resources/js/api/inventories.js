import api from "./axios";

export const inventoryApi = {
  async shopList() {
    const { data } = await api.get("/shop/inventories");
    return data?.data ?? data;
  },

  async index() {
    const { data } = await api.get("/admin/inventories");
    return data?.data ?? data;
  },

  async show(encryptedId) {
    const { data } = await api.get(`/admin/inventories/${encryptedId}`);
    return data?.data ?? data;
  },

  async create(payload) {
    const { data } = await api.post("/admin/inventories", payload);
    return { data: data?.data, message: data?.message };
  },

  async update(encryptedId, payload) {
    const { data } = await api.put(`/admin/inventories/${encryptedId}`, payload);
    return { data: data?.data, message: data?.message };
  },

  async remove(encryptedId) {
    const { data } = await api.delete(`/admin/inventories/${encryptedId}`);
    return { message: data?.message, data: data?.data ?? data };
  },

  async adjust(encryptedId, payload) {
    const { data } = await api.put(`/admin/inventories/${encryptedId}/adjust`, payload);
    return { data: data?.data, message: data?.message };
  },

  async transfert(encryptedId, payload) {
    const { data } = await api.put(`/admin/inventories/${encryptedId}/transfert`, payload);
    return { data: data?.data, message: data?.message };
  },
};
