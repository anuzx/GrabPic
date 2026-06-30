import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { config } from "../config/env";
import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { prisma } from "db";

const googleAuth = asyncHandler((_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: config.googleRedirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  if (!code) {
    throw new ApiError(400, "Missing authorization code");
  }

  const { data } = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: config.googleRedirectUri,
      grant_type: "authorization_code",
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const client = new OAuth2Client(config.googleClientId);
  const ticket = await client.verifyIdToken({
    idToken: data.id_token,
    audience: config.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new ApiError(400, "Invalid Google token payload");
  }

  let user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: payload.email,
        name: payload.name ?? payload.email.split("@")[0]!,
      },
    });
  }

  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: payload.sub!,
      },
    },
    create: {
      userId: user.id,
      provider: "google",
      providerAccountId: payload.sub!,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresAt: data.expires_in
        ? Math.floor(Date.now() / 1000) + data.expires_in
        : null,
      tokenType: data.token_type ?? null,
      scope: data.scope ?? null,
    },
    update: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? undefined,
      expiresAt: data.expires_in
        ? Math.floor(Date.now() / 1000) + data.expires_in
        : undefined,
      tokenType: data.token_type ?? undefined,
      scope: data.scope ?? undefined,
    },
  });

  const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.redirect(config.frontendUrl);
});

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

export { googleAuth, googleCallback, getMe, logout };
