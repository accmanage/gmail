import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { corsOrigins } from "../config/env.js";
import { verifyAccessToken } from "../utils/tokens.js";

export type LiveUser = {
  userId: number;
  username: string;
  socketId: string;
  lastSeen: string;
  heartbeat?: unknown;
};

const liveUsers = new Map<number, LiveUser>();
let io: Server | null = null;

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: { origin: corsOrigins, credentials: true }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Missing socket token"));
      const payload = verifyAccessToken(String(token));
      socket.data.user = payload;
      next();
    } catch {
      next(new Error("Invalid socket token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    liveUsers.set(Number(user.sub), {
      userId: Number(user.sub),
      username: user.username,
      socketId: socket.id,
      lastSeen: new Date().toISOString()
    });
    broadcastLiveUsers();

    socket.on("heartbeat", (heartbeat) => {
      const current = liveUsers.get(Number(user.sub));
      if (current) {
        current.lastSeen = new Date().toISOString();
        current.heartbeat = heartbeat;
      }
      broadcastLiveUsers();
    });

    socket.on("disconnect", () => {
      liveUsers.delete(Number(user.sub));
      broadcastLiveUsers();
    });
  });

  return io;
}

export function emitActivity(activity: unknown) {
  io?.emit("activity:new", activity);
}

export function broadcastLiveUsers() {
  io?.emit("live-users", Array.from(liveUsers.values()));
}

export function getLiveUserCount() {
  return liveUsers.size;
}
