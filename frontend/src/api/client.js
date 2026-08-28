import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const TOKEN_KEY = "mdp_tokens";

export function getTokens() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setTokens(tokens) {
  if (!tokens) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use((config) => {
  const tokens = getTokens();
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  const tokens = getTokens();
  if (!tokens?.refresh) throw new Error("No refresh token");

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/token/refresh/`, { refresh: tokens.refresh })
      .then((res) => {
        const updated = { ...tokens, access: res.data.access };
        setTokens(updated);
        return updated;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (response?.status === 401 && !config._retried && getTokens()?.refresh) {
      config._retried = true;
      try {
        const tokens = await refreshAccessToken();
        config.headers.Authorization = `Bearer ${tokens.access}`;
        return apiClient(config);
      } catch {
        setTokens(null);
        window.dispatchEvent(new CustomEvent("mdp:session-expired"));
      }
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(error, fallback = "Ocurrió un error. Intentá de nuevo.") {
  if (!error?.response) return "No se pudo conectar con el servidor.";
  const data = error.response.data;
  if (!data) return fallback;
  if (typeof data.detail === "string") return data.detail;
  if (data.errors && typeof data.errors === "object") {
    const firstField = Object.values(data.errors)[0];
    if (Array.isArray(firstField)) return firstField[0];
    if (typeof firstField === "string") return firstField;
  }
  return fallback;
}
