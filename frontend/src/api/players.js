import { apiClient } from "./client";

export const playersApi = {
  search: (params) => apiClient.get("/players/", { params }).then((r) => r.data),
  positions: () => apiClient.get("/positions/").then((r) => r.data),
  statuses: () => apiClient.get("/player-statuses/").then((r) => r.data),
};
