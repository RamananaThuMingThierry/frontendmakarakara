import api from './axios';

const pathId = (id) => encodeURIComponent(String(id ?? ""));

export const categoriesApi = {
  async list() {
    const res = await api.get("/admin/categories");
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/admin/categories", payload);
    return { data: res.data, message: res.data.message };
  },

  async show(id) {
    const res = await api.get(`/admin/categories/${pathId(id)}`);
    return res.data;
  },

  async update(id, payload) {
    const res = await api.put(`/admin/categories/${pathId(id)}`, payload);
    return { data: res.data, message: res.data.message };
  },

  async remove(id) {
    const res = await api.delete(`/admin/categories/${pathId(id)}`);
    return { message: res.data.message };
  },
};
