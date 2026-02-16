import api from "./axios";

export async function logoutAdminApi() {
  const { data } = await api.post("admin/logout");
  return data;
}