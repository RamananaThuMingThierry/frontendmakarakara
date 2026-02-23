import api from "./axios";

export const activityLogsApi = {
  async list({ page = 1 } = {}) {
    const res = await api.get("/admin/activity-logs", { params: { page } });
    return res.data.data;
  },

  async show(id) {
    const res = await api.get(`/admin/activity-logs/${id}`);
    return res.data.data ?? res.data;
  },

  async remove(id) {
    const res = await api.delete(`/admin/activity-logs/${id}`);
    return { message: res.data.message ?? "Deleted" };
  },
};
