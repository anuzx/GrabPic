import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "./config/env";
import { globalRateLimiter } from "./middlewares/rate-limiter/global-rate-limiter.middleware";
import { globalErrorHandler } from "./middlewares/global-error-handler";
import { logger } from "./config/logger";
import { ApiResponse } from "./utils/ApiResponse";

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet() as unknown as express.RequestHandler);

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  }),
);
app.use(express.json({limit:"10mb"}));
app.use(cookieParser());

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  next();
});

app.get("/health", (_req, res) => {
  res.json(
    new ApiResponse(200, "server is healthy", {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }),
  );
});

app.use(globalRateLimiter);

import authRouter from "./modules/auth/auth.routes";
import userRouter from "./modules/user/user.routes";
import eventsRouter from "./modules/events/event.routes";

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/events", eventsRouter);

app.use((req, _res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  (error as any).statusCode = 404;
  next(error);
});

app.use(globalErrorHandler);

export { app };
