import api from "./axios";

const pathId = (id) => encodeURIComponent(String(id ?? ""));

export const productsApi = {
  async shopShow(productEncryptedId) {
    const { data } = await api.get(`/shop/products/${pathId(productEncryptedId)}`);
    return data?.data ?? data;
  },

  async list(categoryId) {
    const res = await api.get(`/admin/categories/${pathId(categoryId)}/products`);
    return res.data;
  },

  async create(categoryId, payload) {
    const res = await api.post(
      `/admin/categories/${pathId(categoryId)}/products`,
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
      `/admin/categories/${pathId(categoryId)}/products/${pathId(productId)}`
    );
    return res.data;
  },

  async update(categoryId, productId, payload) {
    const isFormData = payload instanceof FormData;

    if (isFormData) {
      payload.append("_method", "PUT");
    }

    const res = await api[isFormData ? "post" : "put"](
      `/admin/categories/${pathId(categoryId)}/products/${pathId(productId)}`,
      payload,
      {
        headers: isFormData
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
      }
    );

    return { data: res.data, message: res.data.message };
  },

  async remove(categoryId, productId) {
    const res = await api.delete(
      `/admin/categories/${pathId(categoryId)}/products/${pathId(productId)}`
    );

    return { message: res.data.message };
  },
};
