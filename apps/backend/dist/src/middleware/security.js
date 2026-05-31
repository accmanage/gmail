import crypto from "node:crypto";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { corsOrigins, isProduction } from "../config/env.js";
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
export function corsOptions(origin, callback) {
    if (!origin || corsOrigins.includes(origin))
        return callback(null, true);
    return callback(new AppError(403, "Origin not allowed by CORS"));
}
export function issueCsrfCookie(_req, res, next) {
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
export function csrfGuard(req, _res, next) {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method))
        return next();
    if (req.path === "/api/auth/login" || req.path === "/api/auth/refresh")
        return next();
    const csrfCookie = req.cookies?.csrfToken;
    const csrfHeader = req.get("x-csrf-token");
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        return next(new AppError(403, "CSRF token invalid"));
    }
    next();
}
