import axios from "axios";

function getCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const csrf = getCookie("csrfToken");
  if (csrf) config.headers.set("x-csrf-token", csrf);
  const token = localStorage.getItem("adminAccessToken");
  if (token) config.headers.set("authorization", `Bearer ${token}`);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config.__retried) {
      error.config.__retried = true;
      const refresh = await api.post("/api/auth/refresh");
      localStorage.setItem("adminAccessToken", refresh.data.data.accessToken);
      return api(error.config);
    }
    throw error;
  }
);
