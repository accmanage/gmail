import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../middleware/error.js";
import { requireAtLeast, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { audit } from "../utils/audit.js";
export const poolsRouter = Router();
poolsRouter.use(requireAuth, requireAtLeast("admin"));
poolsRouter.get("/", asyncHandler(async (_req, res) => {
    const pools = await prisma.pool.findMany({
        include: {
            _count: { select: { accounts: true } },
            accounts: { select: { status: true } }
        },
        orderBy: { name: "asc" }
    });
    res.json({ data: pools });
}));
poolsRouter.post("/", validate(z.object({ body: z.object({ name: z.string().min(2), description: z.string().optional() }) })), asyncHandler(async (req, res) => {
    const pool = await prisma.pool.create({ data: req.body });
    await audit(req, "pool.create", "Pool", pool.id);
    res.status(201).json({ data: pool });
}));
poolsRouter.put("/:id", validate(z.object({ params: z.object({ id: z.coerce.number() }), body: z.object({ name: z.string().min(2), description: z.string().optional() }) })), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const pool = await prisma.pool.update({ where: { id }, data: req.body });
    await audit(req, "pool.update", "Pool", pool.id);
    res.json({ data: pool });
}));
poolsRouter.delete("/:id", validate(z.object({ params: z.object({ id: z.coerce.number() }) })), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.pool.delete({ where: { id } });
    await audit(req, "pool.delete", "Pool", id);
    res.json({ data: { ok: true } });
}));
