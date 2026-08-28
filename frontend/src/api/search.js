import { apiClient } from "./client";

export const searchApi = {
  global: (q) => apiClient.get("/search/", { params: { q } }).then((r) => r.data),
};

export const dashboardApi = {
  get: () => apiClient.get("/dashboard/").then((r) => r.data),
};
