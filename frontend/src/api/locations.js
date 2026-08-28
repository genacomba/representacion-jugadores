import { apiClient } from "./client";

export const locationsApi = {
  countries: () => apiClient.get("/locations/countries/").then((r) => r.data),
  cities: (params) => apiClient.get("/locations/cities/", { params }).then((r) => r.data),
  createCity: (payload) => apiClient.post("/locations/cities/", payload).then((r) => r.data),
};
