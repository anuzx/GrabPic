import { prisma } from "db";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import type { Request, Response } from "express";
import { config } from "../config/env";

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

const logout = asyncHandler((_req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
  });
  res.json(new ApiResponse(200, "Logged out successfully", null));
});

export { getMe, logout };
