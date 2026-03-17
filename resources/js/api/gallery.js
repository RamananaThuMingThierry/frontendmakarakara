import api from "./axios";

export const galleryApi = {
  async list({ page = 1 } = {}) {
    const res = await api.get("/admin/galleries", { params: { page } });
    return res.data.data ?? res.data;
  },

  async show(id) {
    const res = await api.get(`/admin/galleries/${id}`);
    return res.data.data ?? res.data;
  },

  async create(payload) {
    const isFD = payload instanceof FormData;
    const res = await api.post("/admin/galleries", payload, {
      headers: isFD ? { "Content-Type": "multipart/form-data" } : undefined,
    });

    return { data: res.data.data ?? res.data, message: res.data.message };
  },

  async remove(id) {
    const res = await api.delete(`/admin/galleries/${id}`);
    return { message: res.data.message ?? "Deleted" };
  },
};
