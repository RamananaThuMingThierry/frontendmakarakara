import api from "./axios";

export const publicTestimonialsApi = {
  async list() {
    const res = await api.get("/testimonials");
    return res.data.data ?? res.data;
  },

  async create(payload) {
    const isFD = payload instanceof FormData;
    const res = await api.post("/testimonials", payload, {
      headers: isFD ? { "Content-Type": "multipart/form-data" } : undefined,
    });

    return { data: res.data.data ?? res.data, message: res.data.message };
  },
};
