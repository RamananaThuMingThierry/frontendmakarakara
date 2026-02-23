import api from "./axios";

export const slidesApi = {
  async list({ page = 1 } = {}) {
    const res = await api.get("/admin/slides", { params: { page } });
    return res.data.data ?? res.data;
  },

  async create(payload) {
    const isFD = payload instanceof FormData;
    const res = await api.post("/admin/slides", payload, {
      headers: isFD ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return { data: res.data.data ?? res.data, message: res.data.message };
  },

async update(id, payload) {
  const isFD = payload instanceof FormData;

  if (isFD) {
    payload.set("_method", "PUT");
  }

  const res = await api.post(`/admin/slides/${id}`, payload, {
    headers: isFD ? { "Content-Type": "multipart/form-data" } : undefined,
  });

  return { data: res.data.data ?? res.data, message: res.data.message };
},

  async remove(id) {
    const res = await api.delete(`/admin/slides/${id}`);
    return { message: res.data.message };
  }
};
