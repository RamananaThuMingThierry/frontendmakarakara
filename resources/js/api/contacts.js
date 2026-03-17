import api from "./axios";

export const contactsApi = {
  async list() {
    const res = await api.get("/admin/contacts");
    return res.data.data ?? res.data;
  },

  async show(id) {
    const res = await api.get(`/admin/contacts/${id}`);
    return res.data.data ?? res.data;
  },

  async remove(id) {
    const res = await api.delete(`/admin/contacts/${id}`);
    return { message: res.data.message ?? "Deleted" };
  },
};
