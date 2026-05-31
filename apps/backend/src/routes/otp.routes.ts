import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { decryptSecret } from "../config/crypto.js";
import { asyncHandler, AppError } from "../middleware/error.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { otpLimiter } from "../middleware/security.js";
import { generateTotp } from "../utils/totp.js";
import { audit } from "../utils/audit.js";
import { emitActivity } from "../services/socket.service.js";
import { queueNotification, sendTelegram } from "../services/notification.service.js";

export const otpRouter = Router();
otpRouter.use(requireAuth);

otpRouter.post(
  "/generate",
  otpLimiter,
  validate(z.object({ body: z.object({ accessId: z.number().int() }) })),
  asyncHandler(async (req, res) => {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: req.body.accessId,
        userId: req.user!.id,
        active: true,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }]
      },
      include: {
        account: true,
        user: { include: { preference: true } }
      }
    });
    if (!assignment) throw new AppError(404, "Assigned account not found or expired");
    const { code, remaining } = generateTotp(decryptSecret(assignment.account.secretKeyEncrypted));
    const log = await prisma.oTPLog.create({
      data: {
        userId: req.user!.id,
        accountId: assignment.accountId,
        generatedCode: code,
        ip: req.ip,
        device: req.get("user-agent")
      }
    });
    const activity = {
      user: req.user!.username,
      account: assignment.account.email,
      action: "OTP generated",
      ip: req.ip,
      device: req.get("user-agent"),
      timestamp: log.createdAt
    };
    emitActivity(activity);
    await audit(req, "otp.generate", "Account", assignment.accountId, { logId: log.id });
    if (assignment.user.preference?.notifyOnOtp && assignment.user.preference.telegramChatId) {
      await queueNotification(req.user!.id, "OTP generated", `OTP requested for ${assignment.account.email}`, "telegram");
      await sendTelegram(assignment.user.preference.telegramChatId, `Secure Admin OTP alert: ${assignment.account.email}`);
    }
    res.json({ data: { code, remaining } });
  })
);

otpRouter.get(
  "/history",
  asyncHandler(async (req, res) => {
    const logs = await prisma.oTPLog.findMany({
      where: { userId: req.user!.id },
      include: { account: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    res.json({ data: logs });
  })
);
