import type { NextFunction, Request, Response } from "express";
import type { HttpError } from "http-errors";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const globalErrorHandler = (
  err: HttpError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const errorInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    statusCode: err instanceof ApiError ? err.statusCode : 500,
    message: err.message,
    stack: err.stack,
  };

  // Log the error
  if (err instanceof ApiError) {
    logger.warn("API Error", errorInfo);
  } else {
    logger.error("Unhandled Error", errorInfo);
  }

  // Unexpected error
  if (!(err instanceof ApiError)) {
    return res.status(500).json(
      new ApiResponse(
        500,
        err.message || "Internal Server Error",
        config.nodeEnv === "development"
          ? { stack: err.stack }
          : null,
      ),
    );
  }

  // Known API error
  return res.status(err.statusCode).json(
    new ApiResponse(
      err.statusCode,
      err.message,
      config.nodeEnv === "development"
        ? { stack: err.stack }
        : null,
    ),
  );
};

export { globalErrorHandler };