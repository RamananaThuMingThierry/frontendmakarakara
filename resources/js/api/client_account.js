import api from "./axios";

function toFormData(payload) {
  const fd = new FormData();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined) return;
    fd.append(key, value ?? "");
  });

  return fd;
}

export async function getClientAccount() {
  const { data } = await api.get("/account");
  return data;
}

export async function updateClientAccount(payload) {
  const fd = toFormData(payload);
  fd.append("_method", "PUT");

  const { data } = await api.post("/account", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}

export async function changeClientPassword(payload) {
  const { data } = await api.put("/account/password", payload);
  return data;
}

export async function resendClientVerificationEmail() {
  const { data } = await api.post("/email/verification-notification");
  return data;
}
