import api from './axios';

export const productsApi = {
  async list() {
    const res = await api.get("/admin/products");
    return res.data;
  },

async create(payload) {
  const res = await api.post("/admin/products", payload, {
    headers: payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
  return { data: res.data, message: res.data.message };
},

  async show(id) {
    console.log(id);
    const res = await api.get(`/admin/products/${id}`);
    return res.data;
  },

  async update(id, payload) {
    const res = await api.put(`/admin/products/${id}`, payload);
    return { data: res.data, message: res.data.message };
  },

  async remove(id) {
    const res = await api.delete(`/admin/products/${id}`);
    return { message: res.data.message };
  },
};
