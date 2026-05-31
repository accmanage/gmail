import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../middleware/error.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
export const preferencesRouter = Router();
preferencesRouter.use(requireAuth);
preferencesRouter.post("/update", validate(z.object({
    body: z.object({
        telegram_chat_id: z.string().optional().nullable(),
        notify_on_login: z.boolean().optional(),
        notify_on_expiry: z.boolean().optional(),
        notify_on_otp: z.boolean().optional()
    })
})), asyncHandler(async (req, res) => {
    const pref = await prisma.preference.upsert({
        where: { userId: req.user.id },
        create: {
            userId: req.user.id,
            telegramChatId: req.body.telegram_chat_id,
            notifyOnLogin: req.body.notify_on_login ?? true,
            notifyOnExpiry: req.body.notify_on_expiry ?? true,
            notifyOnOtp: req.body.notify_on_otp ?? false
        },
        update: {
            telegramChatId: req.body.telegram_chat_id,
            notifyOnLogin: req.body.notify_on_login,
            notifyOnExpiry: req.body.notify_on_expiry,
            notifyOnOtp: req.body.notify_on_otp
        }
    });
    res.json({ data: pref });
}));
