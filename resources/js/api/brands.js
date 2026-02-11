import { axios } from "./axios";

export const getBrands = () => axios.get("/admin/brand");
export const createBrand = (data) => axios.post("/admin/brand", data);
export const updateBrand = (id, data) => axios.put(`/admin/brand/${id}`, data);
export const deleteBrand = (id) => axios.delete(`/admin/brand/${id}`);
