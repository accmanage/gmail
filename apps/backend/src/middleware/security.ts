import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { corsOrigins, env, isProduction } from "../config/env.js";
import { AppError } from "./error.js";

export const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: isProduction ? undefined : false
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 180,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

function isAllowedTunnelOrigin(origin: string) {
  if (env.NODE_ENV === "production") return false;
  return [
    /\.ngrok-free\.dev$/i,
    /\.ngrok\.app$/i,
    /\.loca\.lt$/i,
    /\.trycloudflare\.com$/i
  ].some((pattern) => pattern.test(new URL(origin).hostname));
}

export function corsOptions(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
  if (!origin || corsOrigins.includes(origin) || isAllowedTunnelOrigin(origin)) return callback(null, true);
  return callback(new AppError(403, "Origin not allowed by CORS"));
}

export function issueCsrfCookie(_req: Request, res: Response, next: NextFunction) {
  if (!res.locals.csrfToken) {
    res.locals.csrfToken = crypto.randomBytes(24).toString("hex");
    res.cookie("csrfToken", res.locals.csrfToken, {
      httpOnly: false,
      sameSite: "strict",
      secure: isProduction
    });
  }
  next();
}

export function csrfGuard(req: Request, _res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.path === "/api/auth/login" || req.path === "/api/auth/refresh") return next();
  const csrfCookie = req.cookies?.csrfToken;
  const csrfHeader = req.get("x-csrf-token");
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return next(new AppError(403, "CSRF token invalid"));
  }
  next();
}
