import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../middleware/error.js";
import { requireAuth } from "../middleware/auth.js";
export const userPanelRouter = Router();
userPanelRouter.use(requireAuth);
userPanelRouter.get("/accounts", asyncHandler(async (req, res) => {
    const assignments = await prisma.assignment.findMany({
        where: {
            userId: req.user.id,
            active: true,
            OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }]
        },
        include: { account: { include: { pool: true } } },
        orderBy: { assignedAt: "desc" }
    });
    res.json({
        data: assignments.map((assignment) => ({
            accessId: assignment.id,
            email: assignment.account.email,
            poolName: assignment.account.pool?.name,
            favorite: assignment.account.favorite,
            validUntil: assignment.validUntil,
            status: assignment.account.status
        }))
    });
}));
userPanelRouter.get("/dashboard", asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [assignedAccounts, otpRequestsToday, expiringSoon] = await Promise.all([
        prisma.assignment.count({ where: { userId: req.user.id, active: true } }),
        prisma.oTPLog.count({ where: { userId: req.user.id, createdAt: { gte: today } } }),
        prisma.assignment.count({ where: { userId: req.user.id, active: true, validUntil: { lte: soon, gt: new Date() } } })
    ]);
    res.json({
        data: {
            assignedAccounts,
            otpRequestsToday,
            activeAccess: assignedAccounts,
            expiringSoon
        }
    });
}));
