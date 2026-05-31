import { create } from "zustand";
import type { AuthUser } from "@secure-admin/types";
import { api } from "./api";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setToken: (token: string | null) => void;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("adminAccessToken"),
  setToken: (token) => set({ token }),
  login: async (username, password) => {
    const response = await api.post("/api/auth/login", { username, password });
    localStorage.setItem("adminAccessToken", response.data.data.accessToken);
    set({ token: response.data.data.accessToken, user: response.data.data.user });
  },
  logout: async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      localStorage.removeItem("adminAccessToken");
      set({ token: null, user: null });
    }
  }
}));
