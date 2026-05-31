import { Router } from "express";
import { subDays, startOfDay } from "date-fns";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../middleware/error.js";
import { requireAtLeast, requireAuth } from "../middleware/auth.js";
import { getLiveUserCount } from "../services/socket.service.js";
export const dashboardRouter = Router();
dashboardRouter.get("/stats", requireAuth, requireAtLeast("admin"), asyncHandler(async (_req, res) => {
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const today = startOfDay(now);
    const [totalUsers, totalInventory, activeAssignments, otpRequestsToday, expiringAccess, availableAccounts, usedAccounts, otpLogs, recentActivity] = await Promise.all([
        prisma.user.count(),
        prisma.account.count(),
        prisma.assignment.count({ where: { active: true } }),
        prisma.oTPLog.count({ where: { createdAt: { gte: today } } }),
        prisma.assignment.count({ where: { active: true, validUntil: { gte: now, lte: soon } } }),
        prisma.account.count({ where: { status: "available" } }),
        prisma.account.count({ where: { status: "assigned" } }),
        prisma.oTPLog.findMany({
            where: { createdAt: { gte: subDays(now, 7) } },
            select: { createdAt: true }
        }),
        prisma.activityLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { user: { select: { username: true } } }
        })
    ]);
    res.json({
        data: {
            cards: {
                totalUsers,
                totalInventory,
                activeAssignments,
                otpRequestsToday,
                liveUsers: getLiveUserCount(),
                expiringAccess,
                availableAccounts,
                usedAccounts
            },
            dailyOtp: Object.entries(otpLogs.reduce((acc, item) => {
                const day = item.createdAt.toISOString().slice(0, 10);
                acc[day] = (acc[day] ?? 0) + 1;
                return acc;
            }, {})).map(([date, count]) => ({ date, count })),
            recentActivity
        }
    });
}));
