import api from "./axios";
import { toFormData } from "../utils/to-form-data";

export const settingsApi = {
  async show() {
    const { data } = await api.get("/admin/settings");
    return data;
  },

  async update(payload) {
    const hasFile = Object.values(payload || {}).some((value) => value instanceof File);
    let data;

    if (hasFile) {
      const body = toFormData(payload);
      body.append("_method", "PUT");

      ({ data } = await api.post("/admin/settings", body, {
        headers: { "Content-Type": "multipart/form-data" },
      }));
    } else {
      ({ data } = await api.put("/admin/settings", payload));
    }

    return {
      data: data.value,
      key: data.key,
      message: data.message,
    };
  },
};
