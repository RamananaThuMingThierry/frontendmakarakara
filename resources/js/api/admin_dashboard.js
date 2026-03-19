import api from "./axios";

export async function getAdminDashboard(params = {}) {
  const { data } = await api.get("/admin/dashboard", { params });
  return data.data ?? null;
}
