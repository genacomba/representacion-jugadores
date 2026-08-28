import { apiClient } from "./client";

export const clubsApi = {
  list: (params) => apiClient.get("/clubs/", { params }).then((r) => r.data),
  retrieve: (id) => apiClient.get(`/clubs/${id}/`).then((r) => r.data),
  create: (payload) => apiClient.post("/clubs/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.patch(`/clubs/${id}/`, payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/clubs/${id}/`),
  toggleFavorite: (id) => apiClient.post(`/clubs/${id}/toggle_favorite/`).then((r) => r.data),
  people: (id) => apiClient.get(`/clubs/${id}/people/`).then((r) => r.data),
  relationships: (id) => apiClient.get(`/clubs/${id}/relationships/`).then((r) => r.data),
};
