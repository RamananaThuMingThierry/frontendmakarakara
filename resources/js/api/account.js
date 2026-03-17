import api from "./axios";

function toFormData(payload) {
  const fd = new FormData();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined) return;
    fd.append(key, value ?? "");
  });

  return fd;
}

export async function getAccount() {
  const { data } = await api.get("/admin/account");
  return data;
}

export async function updateAccount(payload) {
  const fd = toFormData(payload);
  fd.append("_method", "PUT");

  const { data } = await api.post("/admin/account", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}

export async function changePassword(payload) {
  const { data } = await api.put("/admin/account/password", payload);
  return data;
}

export async function resendVerificationEmail() {
  const { data } = await api.post("/email/verification-notification");
  return data;
}
