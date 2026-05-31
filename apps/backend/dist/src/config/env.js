import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    ENCRYPTION_KEY: z.string().min(32),
    COOKIE_DOMAIN: z.string().optional().default(""),
    CORS_ORIGIN: z.string().default("http://localhost:5173,http://localhost:5174"),
    TELEGRAM_BOT_TOKEN: z.string().optional().default(""),
    WHATSAPP_PROVIDER: z.string().optional().default(""),
    PORT: z.coerce.number().default(4000)
});
export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
export const corsOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());
