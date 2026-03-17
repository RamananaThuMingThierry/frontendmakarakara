import api from "./axios";

export const publicGalleryApi = {
  async list() {
    const res = await api.get("/galleries");
    return res.data.data ?? res.data;
  },

  async toggleLike(id) {
    const res = await api.post(`/galleries/${id}/like`);
    return { data: res.data.data ?? res.data, message: res.data.message };
  },
};
