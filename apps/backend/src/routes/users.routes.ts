import { Router } from "express";
import { addDays } from "date-fns";
import { z } from "zod";
import { RoleName } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { asyncHandler, AppError } from "../middleware/error.js";
import { requireAtLeast, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { hashPassword } from "../utils/password.js";
import { audit } from "../utils/audit.js";

export const usersRouter = Router();
usersRouter.use(requireAuth, requireAtLeast("admin"));

const userBody = z.object({
  username: z.string().min(2).max(64),
  password: z.string().min(8).optional(),
  role: z.nativeEnum(RoleName).default("user"),
  validity_days: z.number().int().positive().optional(),
  is_active: z.boolean().default(true),
  auto_assign_enabled: z.boolean().default(false),
  reseller_permissions: z.boolean().default(false)
});

usersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      where: req.query.search ? { username: { contains: String(req.query.search) } } : undefined,
      include: { role: true, _count: { select: { assignments: true, otpLogs: true, sessions: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json({
      data: users.map(({ passwordHash: _passwordHash, ...user }) => ({
        ...user,
        role: user.role.name
      }))
    });
  })
);

usersRouter.post(
  "/",
  validate(z.object({ body: userBody.extend({ password: z.string().min(8) }) })),
  asyncHandler(async (req, res) => {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: req.body.role } });
    const user = await prisma.user.create({
      data: {
        username: req.body.username,
        passwordHash: await hashPassword(req.body.password),
        roleId: role.id,
        validityUntil: req.body.validity_days ? addDays(new Date(), req.body.validity_days) : null,
        isActive: req.body.is_active,
        autoAssignEnabled: req.body.auto_assign_enabled,
        resellerEnabled: req.body.reseller_permissions,
        preference: { create: {} }
      },
      include: { role: true }
    });
    await audit(req, "user.create", "User", user.id);
    res.status(201).json({ data: { ...user, passwordHash: undefined, role: user.role.name } });
  })
);

usersRouter.put(
  "/:id",
  validate(z.object({ params: z.object({ id: z.coerce.number() }), body: userBody.partial() })),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const current = await prisma.user.findUnique({ where: { id } });
    if (!current) throw new AppError(404, "User not found");
    const role = req.body.role ? await prisma.role.findUniqueOrThrow({ where: { name: req.body.role } }) : null;
    const user = await prisma.user.update({
      where: { id },
      data: {
        username: req.body.username,
        passwordHash: req.body.password ? await hashPassword(req.body.password) : undefined,
        roleId: role?.id,
        validityUntil: req.body.validity_days ? addDays(new Date(), req.body.validity_days) : undefined,
        isActive: req.body.is_active,
        autoAssignEnabled: req.body.auto_assign_enabled,
        resellerEnabled: req.body.reseller_permissions
      },
      include: { role: true }
    });
    await audit(req, "user.update", "User", user.id);
    res.json({ data: { ...user, passwordHash: undefined, role: user.role.name } });
  })
);

usersRouter.delete(
  "/:id",
  validate(z.object({ params: z.object({ id: z.coerce.number() }) })),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (req.user?.id === id) throw new AppError(400, "You cannot delete your own user");
    await prisma.user.delete({ where: { id } });
    await audit(req, "user.delete", "User", id);
    res.json({ data: { ok: true } });
  })
);
