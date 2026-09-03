import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";
import authRoutes from "./modules/auth/auth.routes";
import inventoryRoutes from "./modules/inventory/inventory.routes";
import salesRoutes from "./modules/sales/sales.routes";
import reportsRoutes from "./modules/reports/reports.routes";
import activityRoutes from "./modules/activity/activity.routes";
import usersRoutes from "./modules/users/users.routes";
import contactsRoutes from "./modules/contacts/contacts.routes";
import bankAccountsRoutes from "./modules/bank-accounts/bank-accounts.routes";
import creditsRoutes from "./modules/credits/credits.routes";
import expensesRoutes from "./modules/expenses/expenses.routes";
import branchRoutes from "./modules/branches/branch.routes";
import aiRoutes from "./modules/ai/ai.routes";

const app = express();

app.use(morgan("dev"));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 10000, standardHeaders: true, legacyHeaders: false }));



app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/sales", salesRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/activity", activityRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/contacts", contactsRoutes);
app.use("/api/v1/bank-accounts", bankAccountsRoutes);
app.use("/api/v1/credits", creditsRoutes);
app.use("/api/v1/expenses", expensesRoutes);
app.use("/api/v1/branches", branchRoutes);
app.use("/api/v1/ai", aiRoutes);

app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
app.use(errorHandler);

export default app;
