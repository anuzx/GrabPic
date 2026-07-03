import { prisma } from "db";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { redis } from "../../config/redis";
import jwt from "jsonwebtoken";
import { config } from "../../config/env";
import type { Request, Response } from "express";

const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  res.json(new ApiResponse(200, "User fetched", user));
});

const logout = asyncHandler(async (req: Request, res: Response) => {
  const token =
    req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : req.cookies?.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as {
        jti?: string;
        exp?: number;
      };
      if (decoded.jti && decoded.exp) {
        const ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
        await redis.setEx(`blacklist:jwt:${decoded.jti}`, ttl, "1");
      }
    } catch {
      // ignore invalid token
    }
  }

  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
  res.json(new ApiResponse(200, "Logged out successfully", null));
});

export { getMe, logout };
