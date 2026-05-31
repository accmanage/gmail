import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { addDays, addMinutes } from "date-fns";
import { env } from "../config/env.js";
export function signAccessToken(payload) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
}
export function signRefreshToken(payload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
}
export function verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
export function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}
export function newSessionId() {
    return crypto.randomUUID();
}
export const accessExpiresAt = () => addMinutes(new Date(), 15);
export const refreshExpiresAt = () => addDays(new Date(), 30);
