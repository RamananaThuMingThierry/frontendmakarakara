import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://192.168.0.17:8000/api",
  withCredentials: true, // mets true seulement si tu utilises Sanctum cookies
  headers: {
    Accept: "application/json",
  },
});

// ✅ Token en mémoire (évite le bug timing localStorage)
let inMemoryToken = localStorage.getItem("token") || "";

export const setApiToken = (t) => {
  inMemoryToken = t || "";
};

// ✅ Ajoute automatiquement le token
api.interceptors.request.use((config) => {
  const token = inMemoryToken || localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ Gestion erreurs 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // token invalide → logout client
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("roles");
      setApiToken("");
    }
    return Promise.reject(err);
  }
);

export default api;
