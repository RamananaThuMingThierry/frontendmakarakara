import api from "./axios";

export const settingsApi = {
  async show() {
    const { data } = await api.get("/admin/settings");
    return data;
  },

  async update(payload) {
    const { data } = await api.put("/admin/settings", payload);

    return {
      data: data.value,
      key: data.key,
      message: data.message,
    };
  },
};