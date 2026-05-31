import { Router } from "express";
import { z } from "zod";
import Papa from "papaparse";
import { AccountStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { decryptSecret, encryptSecret } from "../config/crypto.js";
import { asyncHandler, AppError } from "../middleware/error.js";
import { requireAtLeast, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { audit } from "../utils/audit.js";
export const accountsRouter = Router();
accountsRouter.use(requireAuth, requireAtLeast("admin"));
const accountBody = z.object({
    email: z.string().email(),
    password: z.string().min(1),
    app_password: z.string().optional().nullable(),
    secret_key: z.string().min(8),
    pool_id: z.number().int().optional().nullable(),
    pool_name: z.string().optional(),
    favorite: z.boolean().default(false),
    status: z.nativeEnum(AccountStatus).default("available")
});
function safeAccount(account, includeSecrets = false) {
    return {
        id: account.id,
        email: account.email,
        poolId: account.poolId,
        pool: account.pool,
        favorite: account.favorite,
        status: account.status,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        assignments: account.assignments,
        password: includeSecrets ? decryptSecret(account.passwordEncrypted) : undefined,
        app_password: includeSecrets && account.appPasswordEncrypted ? decryptSecret(account.appPasswordEncrypted) : undefined
    };
}
accountsRouter.get("/", asyncHandler(async (req, res) => {
    const search = req.query.search ? String(req.query.search) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const accounts = await prisma.account.findMany({
        where: {
            email: search ? { contains: search } : undefined,
            status: status && status in AccountStatus ? status : undefined
        },
        include: {
            pool: true,
            assignments: { where: { active: true }, include: { user: { select: { id: true, username: true } } } }
        },
        orderBy: { createdAt: "desc" }
    });
    res.json({ data: accounts.map((account) => safeAccount(account)) });
}));
accountsRouter.post("/", validate(z.object({ body: accountBody })), asyncHandler(async (req, res) => {
    const pool = req.body.pool_name
        ? await prisma.pool.upsert({
            where: { name: req.body.pool_name },
            create: { name: req.body.pool_name },
            update: {}
        })
        : null;
    const account = await prisma.account.create({
        data: {
            email: req.body.email,
            passwordEncrypted: encryptSecret(req.body.password),
            appPasswordEncrypted: req.body.app_password ? encryptSecret(req.body.app_password) : null,
            secretKeyEncrypted: encryptSecret(req.body.secret_key),
            poolId: req.body.pool_id ?? pool?.id ?? null,
            favorite: req.body.favorite,
            status: req.body.status
        }
    });
    await audit(req, "account.create", "Account", account.id);
    res.status(201).json({ data: safeAccount(account) });
}));
accountsRouter.put("/:id", validate(z.object({ params: z.object({ id: z.coerce.number() }), body: accountBody.partial() })), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const account = await prisma.account.update({
        where: { id },
        data: {
            email: req.body.email,
            passwordEncrypted: req.body.password ? encryptSecret(req.body.password) : undefined,
            appPasswordEncrypted: req.body.app_password ? encryptSecret(req.body.app_password) : undefined,
            secretKeyEncrypted: req.body.secret_key ? encryptSecret(req.body.secret_key) : undefined,
            poolId: req.body.pool_id,
            favorite: req.body.favorite,
            status: req.body.status
        }
    });
    await audit(req, "account.update", "Account", account.id);
    res.json({ data: safeAccount(account) });
}));
accountsRouter.delete("/:id", validate(z.object({ params: z.object({ id: z.coerce.number() }) })), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.account.delete({ where: { id } });
    await audit(req, "account.delete", "Account", id);
    res.json({ data: { ok: true } });
}));
accountsRouter.post("/import", validate(z.object({ body: z.object({ csv: z.string().min(1) }) })), asyncHandler(async (req, res) => {
    const parsed = Papa.parse(req.body.csv, { header: true, skipEmptyLines: true });
    if (parsed.errors.length)
        throw new AppError(422, parsed.errors[0]?.message ?? "Invalid CSV");
    const imported = [];
    for (const row of parsed.data) {
        const item = accountBody.parse({
            email: row.email,
            password: row.password,
            app_password: row.app_password,
            secret_key: row.secret_key,
            pool_name: row.pool_name
        });
        const pool = item.pool_name
            ? await prisma.pool.upsert({ where: { name: item.pool_name }, create: { name: item.pool_name }, update: {} })
            : null;
        imported.push(await prisma.account.upsert({
            where: { email: item.email },
            create: {
                email: item.email,
                passwordEncrypted: encryptSecret(item.password),
                appPasswordEncrypted: item.app_password ? encryptSecret(item.app_password) : null,
                secretKeyEncrypted: encryptSecret(item.secret_key),
                poolId: pool?.id,
                status: "available"
            },
            update: {
                passwordEncrypted: encryptSecret(item.password),
                appPasswordEncrypted: item.app_password ? encryptSecret(item.app_password) : null,
                secretKeyEncrypted: encryptSecret(item.secret_key),
                poolId: pool?.id
            }
        }));
    }
    await audit(req, "account.import", "Account", undefined, { count: imported.length });
    res.status(201).json({ data: { imported: imported.length } });
}));
accountsRouter.get("/export", asyncHandler(async (_req, res) => {
    const accounts = await prisma.account.findMany({ include: { pool: true } });
    const csv = Papa.unparse(accounts.map((account) => ({
        id: account.id,
        email: account.email,
        password: decryptSecret(account.passwordEncrypted),
        app_password: account.appPasswordEncrypted ? decryptSecret(account.appPasswordEncrypted) : "",
        pool_name: account.pool?.name ?? "",
        status: account.status,
        created_at: account.createdAt.toISOString()
    })));
    res.header("content-type", "text/csv");
    res.attachment("secure-admin-accounts.csv");
    res.send(csv);
}));
