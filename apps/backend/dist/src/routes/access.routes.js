import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { asyncHandler, AppError } from "../middleware/error.js";
import { requireAtLeast, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { audit } from "../utils/audit.js";
export const accessRouter = Router();
accessRouter.use(requireAuth, requireAtLeast("admin"));
accessRouter.post("/assign", validate(z.object({
    body: z.object({
        user_id: z.number().int(),
        account_ids: z.array(z.number().int()).min(1),
        valid_until: z.string().datetime().optional().nullable(),
        lifetime: z.boolean().default(false)
    })
})), asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.body.user_id } });
    if (!user)
        throw new AppError(404, "User not found");
    const validUntil = req.body.lifetime ? null : req.body.valid_until ? new Date(req.body.valid_until) : null;
    const results = await prisma.$transaction(async (tx) => {
        const assignments = [];
        for (const accountId of req.body.account_ids) {
            const account = await tx.account.findUnique({ where: { id: accountId } });
            if (!account)
                throw new AppError(404, `Account ${accountId} not found`);
            assignments.push(await tx.assignment.upsert({
                where: { userId_accountId_active: { userId: user.id, accountId, active: true } },
                create: { userId: user.id, accountId, validUntil },
                update: { validUntil, active: true }
            }));
            await tx.account.update({ where: { id: accountId }, data: { status: "assigned" } });
        }
        return assignments;
    });
    await audit(req, "access.assign", "User", user.id, { accountIds: req.body.account_ids });
    res.status(201).json({ data: results });
}));
accessRouter.post("/revoke", validate(z.object({ body: z.object({ assignment_ids: z.array(z.number().int()).min(1) }) })), asyncHandler(async (req, res) => {
    const assignments = await prisma.assignment.updateMany({
        where: { id: { in: req.body.assignment_ids } },
        data: { active: false }
    });
    const accountIds = await prisma.assignment.findMany({
        where: { id: { in: req.body.assignment_ids } },
        select: { accountId: true }
    });
    await prisma.account.updateMany({
        where: { id: { in: accountIds.map((item) => item.accountId) } },
        data: { status: "available" }
    });
    await audit(req, "access.revoke", "Assignment", undefined, { assignmentIds: req.body.assignment_ids });
    res.json({ data: assignments });
}));
accessRouter.post("/cleanup", asyncHandler(async (req, res) => {
    const expired = await prisma.assignment.updateMany({
        where: { active: true, validUntil: { lt: new Date() } },
        data: { active: false }
    });
    await audit(req, "access.cleanup", "Assignment", undefined, { expired: expired.count });
    res.json({ data: expired });
}));
