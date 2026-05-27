import api from "./axios";

const pathId = (id) => encodeURIComponent(String(id ?? ""));

export const galleryApi = {
  async list({ page = 1 } = {}) {
    const res = await api.get("/admin/galleries", { params: { page } });
    return res.data.data ?? res.data;
  },

  async show(id) {
    const res = await api.get(`/admin/galleries/${pathId(id)}`);
    return res.data.data ?? res.data;
  },

  async create(payload) {
    const isFD = payload instanceof FormData;
    const res = await api.post("/admin/galleries", payload, {
      headers: isFD ? { "Content-Type": "multipart/form-data" } : undefined,
    });

    return { data: res.data.data ?? res.data, message: res.data.message };
  },

  async update(id, payload) {
    const isFD = payload instanceof FormData;

    if (isFD) {
      payload.append("_method", "PUT");
    }

    const res = await api[isFD ? "post" : "put"](`/admin/galleries/${pathId(id)}`, payload, {
      headers: isFD ? { "Content-Type": "multipart/form-data" } : undefined,
    });

    return { data: res.data.data ?? res.data, message: res.data.message };
  },

  async remove(id) {
    const res = await api.delete(`/admin/galleries/${pathId(id)}`);
    return { message: res.data.message ?? "Deleted" };
  },
};
