import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
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
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
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

  res.redirect(`${config.frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`);
});

const githubAuth = asyncHandler((_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: config.githubClientId,
    redirect_uri: config.githubRedirectUri,
    scope: "read:user user:email",
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

const githubCallback = asyncHandler(async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  if (!code) {
    throw new ApiError(400, "Missing authorization code");
  }

  const { data: tokenData } = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: config.githubClientId,
      client_secret: config.githubClientSecret,
      code,
      redirect_uri: config.githubRedirectUri,
    },
    {
      headers: { Accept: "application/json" },
    },
  );

  if (!tokenData.access_token) {
    throw new ApiError(400, "Failed to get GitHub access token");
  }

  const { data: ghUser } = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  let email = ghUser.email;
  if (!email) {
    const { data: emails } = await axios.get(
      "https://api.github.com/user/emails",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );
    email = emails.find((e: any) => e.primary)?.email ?? null;
  }

  if (!email) {
    throw new ApiError(400, "No email found from GitHub");
  }

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: ghUser.name ?? ghUser.login,
      },
    });
  }

  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: "github",
        providerAccountId: String(ghUser.id),
      },
    },
    create: {
      userId: user.id,
      provider: "github",
      providerAccountId: String(ghUser.id),
      accessToken: tokenData.access_token,
      refreshToken: null,
      expiresAt: null,
      tokenType: "bearer",
      scope: "read:user user:email",
    },
    update: {
      accessToken: tokenData.access_token,
    },
  });

  const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
    expiresIn: "7d",
  });

  res.redirect(`${config.frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`);
});

export { googleAuth, googleCallback, githubAuth, githubCallback };
