import api from "./axios";

export const testimonialsApi = {
  async list() {
    const res = await api.get("/admin/testimonials");
    return res.data.data ?? res.data;
  },

  async show(id) {
    const res = await api.get(`/admin/testimonials/${id}`);
    return res.data.data ?? res.data;
  },

  async create(payload) {
    const isFD = payload instanceof FormData;
    const res = await api.post("/admin/testimonials", payload, {
      headers: isFD ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return { data: res.data.data ?? res.data, message: res.data.message };
  },

  async update(id, payload) {
    const isFD = payload instanceof FormData;

    if (isFD) {
      payload.set("_method", "PUT");
      const res = await api.post(`/admin/testimonials/${id}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { data: res.data.data ?? res.data, message: res.data.message };
    }

    const res = await api.put(`/admin/testimonials/${id}`, payload);
    return { data: res.data.data ?? res.data, message: res.data.message };
  },

  async remove(id) {
    const res = await api.delete(`/admin/testimonials/${id}`);
    return { message: res.data.message ?? "Deleted" };
  },
};
