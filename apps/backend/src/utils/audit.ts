import type { Request } from "express";
import { prisma } from "../config/prisma.js";

export async function audit(req: Request, action: string, entity?: string, entityId?: number, metadata?: object) {
  await prisma.activityLog.create({
    data: {
      userId: req.user?.id,
      action,
      entity,
      entityId,
      metadata,
      ip: req.ip,
      device: req.get("user-agent")
    }
  });
}
