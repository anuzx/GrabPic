import express from "express";
import type { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./auth/auth.route";
import { config } from "./config/env";
import { ApiResponse } from "./utils/ApiResponse";
import { ApiError } from "./utils/ApiError";

const app = express();

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || "Internal server error";
  res.status(statusCode).json(new ApiResponse(statusCode, message, null));
});

app.listen(Number(config.port), () =>
  console.log(`server running at port ${config.port}`)
);
