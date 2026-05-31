import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { isProduction, env } from "../config/env.js";
import { asyncHandler, AppError } from "../middleware/error.js";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/security.js";
import { requireAuth } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";
import { verifyPassword } from "../utils/password.js";
import { hashToken, newSessionId, refreshExpiresAt, signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens.js";
import { queueNotification, sendTelegram } from "../services/notification.service.js";
export const authRouter = Router();
const cookieOptions = {
    httpOnly: true,
    sameSite: "strict",
    secure: isProduction,
    domain: env.COOKIE_DOMAIN || undefined
};
function setAuthCookies(res, accessToken, refreshToken) {
    res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
}
authRouter.post("/login", authLimiter, validate(z.object({
    body: z.object({
        username: z.string().min(2),
        password: z.string().min(8)
    })
})), asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { username: req.body.username },
        include: { role: true, preference: true }
    });
    if (!user || !(await verifyPassword(req.body.password, user.passwordHash))) {
        throw new AppError(401, "Invalid username or password");
    }
    if (!user.isActive)
        throw new AppError(403, "User account is suspended");
    if (user.validityUntil && user.validityUntil < new Date())
        throw new AppError(403, "User access expired");
    const sessionId = newSessionId();
    const refreshToken = signRefreshToken({ sub: String(user.id), sessionId });
    const accessToken = signAccessToken({
        sub: String(user.id),
        username: user.username,
        role: user.role.name,
        sessionId
    });
    await prisma.session.create({
        data: {
            id: sessionId,
            userId: user.id,
            refreshTokenHash: hashToken(refreshToken),
            ip: req.ip,
            userAgent: req.get("user-agent"),
            expiresAt: refreshExpiresAt()
        }
    });
    await audit(req, "auth.login", "User", user.id, { username: user.username });
    if (user.preference?.notifyOnLogin && user.preference.telegramChatId) {
        await queueNotification(user.id, "Login alert", `Login detected for ${user.username}`, "telegram");
        await sendTelegram(user.preference.telegramChatId, `Secure Admin login alert: ${user.username}`);
    }
    setAuthCookies(res, accessToken, refreshToken);
    res.json({
        data: {
            accessToken,
            user: { id: user.id, username: user.username, role: user.role.name, isActive: user.isActive }
        }
    });
}));
authRouter.post("/refresh", authLimiter, asyncHandler(async (req, res) => {
    const incoming = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incoming)
        throw new AppError(401, "Refresh token required");
    const payload = verifyRefreshToken(incoming);
    const session = await prisma.session.findFirst({
        where: {
            id: payload.sessionId,
            refreshTokenHash: hashToken(incoming),
            revokedAt: null,
            expiresAt: { gt: new Date() }
        },
        include: { user: { include: { role: true } } }
    });
    if (!session || !session.user.isActive)
        throw new AppError(401, "Invalid refresh token");
    await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    const newId = newSessionId();
    const refreshToken = signRefreshToken({ sub: String(session.userId), sessionId: newId });
    const accessToken = signAccessToken({
        sub: String(session.userId),
        username: session.user.username,
        role: session.user.role.name,
        sessionId: newId
    });
    await prisma.session.create({
        data: {
            id: newId,
            userId: session.userId,
            refreshTokenHash: hashToken(refreshToken),
            userAgent: req.get("user-agent"),
            ip: req.ip,
            expiresAt: refreshExpiresAt()
        }
    });
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ data: { accessToken } });
}));
authRouter.post("/logout", requireAuth, asyncHandler(async (req, res) => {
    if (req.user?.sessionId) {
        await prisma.session.updateMany({ where: { id: req.user.sessionId }, data: { revokedAt: new Date() } });
    }
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
    res.json({ data: { ok: true } });
}));
