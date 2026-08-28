import { apiClient } from "./client";

export const authApi = {
  login: (username, password) =>
    apiClient.post("/auth/token/", { username, password }).then((r) => r.data),
  logout: (refresh) => apiClient.post("/auth/logout/", { refresh }).then((r) => r.data),
  me: () => apiClient.get("/auth/me/").then((r) => r.data),
};
