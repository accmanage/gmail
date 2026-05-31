export const roleHierarchy = ["user", "reseller", "admin", "super_admin"] as const;

export const apiPaths = {
  login: "/api/auth/login",
  refresh: "/api/auth/refresh",
  logout: "/api/auth/logout",
  stats: "/api/dashboard/stats",
  otpGenerate: "/api/otp/generate"
} as const;
