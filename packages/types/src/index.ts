export type RoleName = "super_admin" | "admin" | "reseller" | "user";

export type AuthUser = {
  id: number;
  username: string;
  role: RoleName;
  isActive: boolean;
  validityUntil?: string | null;
};

export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type DashboardStats = {
  totalUsers: number;
  totalInventory: number;
  activeAssignments: number;
  otpRequestsToday: number;
  liveUsers: number;
  expiringAccess: number;
  availableAccounts: number;
  usedAccounts: number;
};

export type PublicAccount = {
  id: number;
  email: string;
  poolName?: string;
  favorite: boolean;
  validUntil?: string | null;
  status: string;
};

export type OtpResponse = {
  code: string;
  remaining: number;
};

export type HeartbeatPayload = {
  ip?: string;
  device?: string;
  browser?: string;
  os?: string;
  battery?: number | null;
  online: boolean;
  screen: string;
};
