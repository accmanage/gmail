import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { authRouter } from "./routes/auth.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { poolsRouter } from "./routes/pools.routes.js";
import { accountsRouter } from "./routes/accounts.routes.js";
import { accessRouter } from "./routes/access.routes.js";
import { otpRouter } from "./routes/otp.routes.js";
import { preferencesRouter } from "./routes/preferences.routes.js";
import { trackingRouter } from "./routes/tracking.routes.js";
import { userPanelRouter } from "./routes/user-panel.routes.js";
import { apiLimiter, corsOptions, csrfGuard, helmetMiddleware, issueCsrfCookie } from "./middleware/security.js";
import { errorHandler, notFound } from "./middleware/error.js";

export const app = express();

app.set("trust proxy", 1);
app.use(helmetMiddleware);
app.use(cors({ origin: corsOptions, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));
app.use(apiLimiter);
app.use(issueCsrfCookie);
app.use(csrfGuard);

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/users", usersRouter);
app.use("/api/pools", poolsRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/access", accessRouter);
app.use("/api/otp", otpRouter);
app.use("/api/preferences", preferencesRouter);
app.use("/api/tracking", trackingRouter);
app.use("/api/me", userPanelRouter);

app.use(notFound);
app.use(errorHandler);
