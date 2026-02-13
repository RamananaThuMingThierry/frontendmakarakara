import api from "./axios";

export async function loginApi(payload) {
  // payload: { email, password }
  const { data } = await api.post("/login", payload);
  return data; // attendu: { token, user }
}

export async function meApi() {
  const { data } = await api.get("/me");
  return data; // attendu: { user }
}

export async function logoutApi() {
  const { data } = await api.post("/logout");
  return data;
}
