import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { prisma } from "db";
import { ApiError } from "../utils/ApiError";
import { redis } from "../config/redis";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "Not authenticated");
    }
    const token = authHeader.slice(7);
    if (!token) {
      throw new ApiError(401, "Not authenticated");
    }

    const decoded = jwt.verify(token, config.jwtSecret) as {
      userId: string;
      jti?: string;
    };

    if (decoded.jti) {
      try {
        const blacklisted = await redis.get(`blacklist:jwt:${decoded.jti}`);
        if (blacklisted) {
          throw new ApiError(401, "Token has been revoked");
        }
      } catch (error) {
        if (error instanceof ApiError) throw error;
        // Redis is down — fail open (allow the request)
        // Tradeoff: availability > strict blacklist enforcement
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError(401, "Invalid token"));
    }
  }
};
