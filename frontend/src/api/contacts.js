import { apiClient } from "./client";

export const contactsApi = {
  list: (params) => apiClient.get("/people/", { params }).then((r) => r.data),
  retrieve: (id) => apiClient.get(`/people/${id}/`).then((r) => r.data),
  create: (payload) => apiClient.post("/people/", payload).then((r) => r.data),
  update: (id, payload) => apiClient.patch(`/people/${id}/`, payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/people/${id}/`),
  toggleFavorite: (id) => apiClient.post(`/people/${id}/toggle_favorite/`).then((r) => r.data),
  relationships: (id) => apiClient.get(`/people/${id}/relationships/`).then((r) => r.data),
};

export const relationshipsApi = {
  create: (payload) => apiClient.post("/relationships/", payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/relationships/${id}/`),
  types: () => apiClient.get("/relationship-types/").then((r) => r.data),
};

export const interactionsApi = {
  listForEntity: (entityType, entityId) =>
    apiClient
      .get("/interactions/", { params: { entity_type: entityType, entity_id: entityId } })
      .then((r) => r.data),
  create: (payload) => apiClient.post("/interactions/", payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/interactions/${id}/`),
};

export const resourcesApi = {
  listForEntity: (entityType, entityId) =>
    apiClient
      .get("/resources/", { params: { entity_type: entityType, entity_id: entityId } })
      .then((r) => r.data),
  create: (payload) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") formData.append(key, value);
    });
    return apiClient
      .post("/resources/", formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },
  remove: (id) => apiClient.delete(`/resources/${id}/`),
};
