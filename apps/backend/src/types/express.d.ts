import type { RoleName } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: RoleName;
        sessionId?: string;
      };
    }
  }
}

export {};
