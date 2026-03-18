import api from "./axios";

export const adminReservationsApi = {
  async list() {
    const res = await api.get("/admin/reservations");
    return res.data.data ?? [];
  },

  async show(id) {
    const res = await api.get(`/admin/reservations/${id}`);
    return res.data.data ?? res.data;
  },
};
