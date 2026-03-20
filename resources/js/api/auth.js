import api from "./axios";

export async function registerApi(payload) {
  const { data } = await api.post("/register", payload);
  return data;
}

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

export async function forgotPasswordApi(payload) {
  const { data } = await api.post("/forgot-password", payload);
  return data;
}

export async function verifyResetCodeApi(payload) {
  const { data } = await api.post("/forgot-password/verify-code", payload);
  return data;
}

export async function resetPasswordApi(payload) {
  const { data } = await api.post("/reset-password", payload);
  return data;
}
