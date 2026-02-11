import { api } from "./axios";

export const getBrands = () => api.get("/admin/brand");
export const createBrand = (data) => api.post("/admin/brand", data);
export const updateBrand = (id, data) => api.put(`/admin/brand/${id}`, data);
export const deleteBrand = (id) => api.delete(`/admin/brand/${id}`);
