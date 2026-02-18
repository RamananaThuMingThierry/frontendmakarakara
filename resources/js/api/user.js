import api from "./axios";

function toFormData(payload) {
  const fd = new FormData();
  Object.entries(payload || {}).forEach(([k, v]) => {
    if (v === undefined) return;

    // tableau -> role etc. (ici on utilise role en string, donc pas besoin)
    if (v === null) fd.append(k, "");
    else fd.append(k, v);
  });
  return fd;
}

export const usersApi = {
  async list() {
    const res = await api.get("/admin/users");
    return res.data;
  },

  async create(payload) {
    const fd = toFormData(payload);
    const res = await api.post("/admin/users", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data: res.data.data ?? res.data, message: res.data.message };
  },

  async update(id, payload) {
    const fd = toFormData(payload);

    // si ton backend attend PUT en multipart, ok.
    // sinon souvent on fait POST + _method=PUT
    fd.append("_method", "PUT");

    const res = await api.post(`/admin/users/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data: res.data.data ?? res.data, message: res.data.message };
  },

  async remove(id) {
    const res = await api.delete(`/admin/users/${id}`);
    return { message: res.data.message };
  },

  async restore(encryptedId) {
  const res = await api.post(`/admin/users/${encryptedId}/restore`);
  return res.data;
},

async forceDelete(encryptedId) {
  const res = await api.delete(`/admin/users/${encryptedId}/force-delete`);
  return res.data;
},

};
