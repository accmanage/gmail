import { io } from "socket.io-client";

export function createAdminSocket(token: string) {
  return io(import.meta.env.VITE_SOCKET_URL ?? window.location.origin, {
    withCredentials: true,
    auth: { token }
  });
}
