import api from "./axios";

// petit helper interne
const toFormData = (payload) => {
  const fd = new FormData();
  Object.entries(payload || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;

    // File / Blob
    if (v instanceof File || v instanceof Blob) {
      fd.append(k, v);
      return;
    }

    if (typeof v === "boolean") {
      fd.append(k, v ? "1" : "0");
      return;
    }

    fd.append(k, String(v));
  });
  return fd;
};

export const paymentMethodsApi = {
  async index() {
    const { data } = await api.get("/admin/payment_methods");
    return data?.data ?? data;
  },

  async show(encryptedId) {
    const { data } = await api.get(`/admin/payment_methods/${encryptedId}`);
    return data?.data ?? data;
  },

  async create(payload) {
    const hasFile = payload?.image instanceof File || payload?.imageFile instanceof File;

    if (hasFile) {
      const fd = toFormData({
        ...payload,
        image: payload.image ?? payload.imageFile, 
      });

      const { data } = await api.post("/admin/payment_methods", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return { data: data?.data ?? data, message: data?.message };
    }

    // sinon JSON normal
    const { data } = await api.post("/admin/payment_methods", payload);
    return { data: data?.data, message: data?.message };
  },

  async update(encryptedId, payload) {
    const hasFile = payload?.image instanceof File || payload?.imageFile instanceof File;

    if (hasFile) {
      const fd = toFormData({
        ...payload,
        image: payload.image ?? payload.imageFile,
      });
      fd.append("_method", "PUT");

      const { data } = await api.post(`/admin/payment_methods/${encryptedId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return { data: data?.data ?? data, message: data?.message };
    }

    // sinon JSON normal
    const { data } = await api.put(`/admin/payment_methods/${encryptedId}`, payload);
    return { data: data?.data, message: data?.message };
  },

  async remove(encryptedId) {
    const { data } = await api.delete(`/admin/payment_methods/${encryptedId}`);
    return { message: data?.message, data: data?.data ?? data };
  },
};