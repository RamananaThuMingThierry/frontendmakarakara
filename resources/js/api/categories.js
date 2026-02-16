import api from "./axios";

export const categoriesApi = {
  async list() {
    const res = await api.get("/admin/categories");
    return res.data.data ?? res.data; // selon ton format
  },
  async create(payload) {
    const res = await api.post("/admin/categories", payload);
    return res.data.data ?? res.data;
  },
  async update(id, payload) {
    const res = await api.put(`/admin/categories/${id}`, payload);
    return res.data.data ?? res.data;
  },
  async remove(id) {
    await api.delete(`/admin/categories/${id}`);
  },
};
