import api from "./axios";

export async function createMyReservation() {
  const { data } = await api.post("/my-reservations");
  return data;
}
