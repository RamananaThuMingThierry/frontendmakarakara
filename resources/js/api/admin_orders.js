import api from "./axios";

export const adminOrdersApi = {
  async list() {
    const res = await api.get("/admin/orders");
    return res.data.data ?? [];
  },

  async show(id) {
    const res = await api.get(`/admin/orders/${id}`);
    return res.data.data ?? res.data;
  },

  async confirm(id) {
    const res = await api.post(`/admin/orders/${id}/confirm`);
    return res.data.data ?? res.data;
  },

  async startProcessing(id) {
    const res = await api.post(`/admin/orders/${id}/processing`);
    return res.data.data ?? res.data;
  },

  async markAsPaid(id) {
    const res = await api.post(`/admin/orders/${id}/mark-paid`);
    return res.data.data ?? res.data;
  },

  async sendReceipt(id) {
    const res = await api.post(`/admin/orders/${id}/send-receipt`);
    return res.data.data ?? res.data;
  },

  async cancel(id) {
    const res = await api.post(`/admin/orders/${id}/cancel`);
    return res.data.data ?? res.data;
  },

  async markAsDelivered(id) {
    const res = await api.post(`/admin/orders/${id}/deliver`);
    return res.data.data ?? res.data;
  },

  async updateDeliveryFee(id, payload) {
    const res = await api.put(`/admin/orders/${id}/delivery-fee`, payload);
    return res.data.data ?? res.data;
  },

  async updateNotes(id, payload) {
    const res = await api.put(`/admin/orders/${id}/notes`, payload);
    return res.data.data ?? res.data;
  },
};
