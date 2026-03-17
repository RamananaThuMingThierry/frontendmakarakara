import api from "./axios";

export const productsApi = {
  async shopShow(productEncryptedId) {
    const { data } = await api.get(`/shop/products/${productEncryptedId}`);
    return data?.data ?? data;
  },

  async list(categoryId) {
    const res = await api.get(`/admin/categories/${categoryId}/products`);
    return res.data;
  },

  async create(categoryId, payload) {
    const res = await api.post(
      `/admin/categories/${categoryId}/products`,
      payload,
      {
        headers:
          payload instanceof FormData
            ? { "Content-Type": "multipart/form-data" }
            : undefined,
      }
    );

    return { data: res.data, message: res.data.message };
  },

  async show(categoryId, productId) {
    const res = await api.get(
      `/admin/categories/${categoryId}/products/${productId}`
    );
    return res.data;
  },

  async update(categoryId, productId, payload) {
    const res = await api.put(
      `/admin/categories/${categoryId}/products/${productId}`,
      payload
    );

    return { data: res.data, message: res.data.message };
  },

  async remove(categoryId, productId) {
    const res = await api.delete(
      `/admin/categories/${categoryId}/products/${productId}`
    );

    return { message: res.data.message };
  },
};
