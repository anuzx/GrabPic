import express from "express";
import helmet from "helmet";
import type { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "./config/env";
import { ApiResponse } from "./utils/ApiResponse";
import { ApiError } from "./utils/ApiError";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

import authRouter from "./modules/auth/auth.routes";
import userRouter from "./modules/user/user.route";
import eventsRouter from "./modules/events/event.routes";

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/events", eventsRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || "Internal server error";
  res.status(statusCode).json(new ApiResponse(statusCode, message, null));
});

app.listen(Number(config.port), () =>
  console.log(`server running at port ${config.port}`),
);
