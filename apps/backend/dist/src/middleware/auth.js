import { prisma } from "../config/prisma.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { AppError } from "./error.js";
const roleRank = {
    user: 1,
    reseller: 2,
    admin: 3,
    super_admin: 4
};
export async function requireAuth(req, _res, next) {
    try {
        const headerToken = req.get("authorization")?.replace(/^Bearer\s+/i, "");
        const token = headerToken || req.cookies?.accessToken;
        if (!token)
            throw new AppError(401, "Authentication required");
        const payload = verifyAccessToken(token);
        const session = await prisma.session.findFirst({
            where: {
                id: payload.sessionId,
                userId: Number(payload.sub),
                revokedAt: null,
                expiresAt: { gt: new Date() }
            },
            include: { user: { include: { role: true } } }
        });
        if (!session || !session.user.isActive)
            throw new AppError(401, "Session expired");
        req.user = {
            id: session.user.id,
            username: session.user.username,
            role: session.user.role.name,
            sessionId: session.id
        };
        next();
    }
    catch (error) {
        next(error instanceof AppError ? error : new AppError(401, "Invalid authentication token"));
    }
}
export function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user)
            return next(new AppError(401, "Authentication required"));
        if (roles.includes(req.user.role))
            return next();
        return next(new AppError(403, "Insufficient permissions"));
    };
}
export function requireAtLeast(role) {
    return (req, _res, next) => {
        if (!req.user)
            return next(new AppError(401, "Authentication required"));
        if (roleRank[req.user.role] >= roleRank[role])
            return next();
        return next(new AppError(403, "Insufficient permissions"));
    };
}
