import api from "./axios";

export const adminNotificationsApi = {
  async list({ page = 1, perPage = 15, unreadOnly = false } = {}) {
    const res = await api.get("/admin/notifications", {
      params: { page, per_page: perPage, unread_only: unreadOnly ? 1 : 0 },
    });
    return {
      pager: res.data.data,
      unreadCount: res.data.meta?.unread_count ?? 0,
    };
  },

  async summary(limit = 6) {
    const res = await api.get("/admin/notifications-summary", { params: { limit } });
    return res.data.data ?? { items: [], unread_count: 0 };
  },

  async markAsRead(id) {
    const res = await api.post(`/admin/notifications/${id}/read`);
    return {
      item: res.data.data,
      unreadCount: res.data.meta?.unread_count ?? 0,
    };
  },

  async markAllAsRead() {
    const res = await api.post("/admin/notifications/read-all");
    return {
      updatedCount: res.data.data?.updated_count ?? 0,
      unreadCount: res.data.meta?.unread_count ?? 0,
    };
  },
};
