import type { Request, Response, NextFunction } from "express";
import { createClient } from "redis";

const client = createClient();
await client.connect();

const LIMIT = 5;
const WINDOW = 60;

export async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.userId;

    const key = `rate_limit:${userId}`;

    const current = await client.incr(key);

    if (current === 1) {
      await client.expire(key, WINDOW);
    }

    if (current > LIMIT) {
      return res.status(429).json({
        message: "Too many requests",
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}
