import { apiClient } from "./client";

export const mapApi = {
  cities: (categories) =>
    apiClient
      .get("/map/cities/", { params: categories?.length ? { category: categories.join(",") } : {} })
      .then((r) => r.data),
  cityEntities: (cityId, categories) =>
    apiClient
      .get(`/map/cities/${cityId}/entities/`, {
        params: categories?.length ? { category: categories.join(",") } : {},
      })
      .then((r) => r.data),
};
