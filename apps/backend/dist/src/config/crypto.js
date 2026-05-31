import crypto from "node:crypto";
import { env } from "./env.js";
const algorithm = "aes-256-gcm";
function getKey() {
    try {
        const decoded = Buffer.from(env.ENCRYPTION_KEY, "base64");
        if (decoded.length === 32)
            return decoded;
    }
    catch {
        // Fall through to hash mode for development-friendly keys.
    }
    return crypto.createHash("sha256").update(env.ENCRYPTION_KEY).digest();
}
export function encryptSecret(value) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}
export function decryptSecret(payload) {
    const [ivB64, tagB64, encryptedB64] = payload.split(".");
    if (!ivB64 || !tagB64 || !encryptedB64)
        throw new Error("Invalid encrypted payload");
    const decipher = crypto.createDecipheriv(algorithm, getKey(), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedB64, "base64")),
        decipher.final()
    ]);
    return decrypted.toString("utf8");
}
