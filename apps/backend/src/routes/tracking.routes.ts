import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { broadcastLiveUsers } from "../services/socket.service.js";
import { audit } from "../utils/audit.js";

export const trackingRouter = Router();
trackingRouter.use(requireAuth);

trackingRouter.post(
  "/heartbeat",
  validate(
    z.object({
      body: z.object({
        ip: z.string().optional(),
        device: z.string().optional(),
        browser: z.string().optional(),
        os: z.string().optional(),
        battery: z.number().nullable().optional(),
        online: z.boolean(),
        screen: z.string()
      })
    })
  ),
  asyncHandler(async (req, res) => {
    await audit(req, "tracking.heartbeat", "User", req.user!.id, req.body);
    broadcastLiveUsers();
    res.json({ data: { ok: true } });
  })
);
