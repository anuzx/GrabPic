import { rateLimit } from "express-rate-limit";
import type { Request, Response } from "express";

interface RateLimitedRequest extends Request {
  rateLimit?: {
    limit: number;
    used: number;
    remaining: number;
    resetTime?: Date;
  };
}

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: RateLimitedRequest, res: Response) => {
    res.status(429).json({
      message: "too many requests",
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

export { globalRateLimiter };
