import { create } from "zustand";
import type { AuthUser } from "@secure-admin/types";
import { api } from "./api";

type Store = {
  token: string | null;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = create<Store>((set) => ({
  token: localStorage.getItem("userAccessToken"),
  user: null,
  login: async (username, password) => {
    const response = await api.post("/api/auth/login", { username, password });
    localStorage.setItem("userAccessToken", response.data.data.accessToken);
    set({ token: response.data.data.accessToken, user: response.data.data.user });
  },
  logout: async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      localStorage.removeItem("userAccessToken");
      set({ token: null, user: null });
    }
  }
}));
