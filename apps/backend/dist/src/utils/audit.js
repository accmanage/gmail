import { prisma } from "../config/prisma.js";
export async function audit(req, action, entity, entityId, metadata) {
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
