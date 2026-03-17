import api from "./axios";

function extractRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

export const couponsApi = {
  async list() {
    const res = await api.get("/admin/coupons");
    return extractRows(res.data);
  },

  async show(id) {
    const res = await api.get(`/admin/coupons/${id}`);
    return res.data.data ?? res.data;
  },

  async create(payload) {
    const res = await api.post("/admin/coupons", payload);
    return { data: res.data.data ?? res.data, message: res.data.message };
  },

  async update(id, payload) {
    const res = await api.put(`/admin/coupons/${id}`, payload);
    return { data: res.data.data ?? res.data, message: res.data.message };
  },

  async remove(id) {
    const res = await api.delete(`/admin/coupons/${id}`);
    return { message: res.data.message };
  },
};
