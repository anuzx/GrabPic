import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";

const googleAuth = asyncHandler((req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  res.redirect(url);
});

const googleCallback = asyncHandler(async (req, res) => {});

export { googleAuth, googleCallback };
