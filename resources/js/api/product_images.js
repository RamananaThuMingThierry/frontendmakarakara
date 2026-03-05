import api from "./axios";

export const productImagesApi = {

  async list(params) {
    const res = await api.get("/admin/product_images", { params });
    return res.data;
  },

  async create(payload) {
    const res = await api.post("/admin/product_images", payload, {
      headers:
        payload instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    });

    return { data: res.data, message: res.data.message };
  },

  /**
   * DELETE /admin/product_images/{encryptedId}
   */
  async remove(encryptedId) {
    const res = await api.delete(`/admin/product_images/${encryptedId}`);
    return { message: res.data.message };
  },
};