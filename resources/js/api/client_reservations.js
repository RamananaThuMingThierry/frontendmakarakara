import api from "./axios";

export async function listMyReservations() {
  const { data } = await api.get("/my-reservations");
  return data.data ?? [];
}

export async function createMyReservation() {
  const { data } = await api.post("/my-reservations");
  return data;
}

export async function cancelMyReservation(reservationId) {
  const { data } = await api.delete(`/my-reservations/${reservationId}`);
  return data;
}

export async function checkoutMyReservation(reservationId) {
  const { data } = await api.post(`/my-reservations/${reservationId}/checkout`);
  return data;
}
