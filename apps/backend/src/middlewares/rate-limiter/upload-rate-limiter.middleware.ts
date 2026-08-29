import type { NextFunction, Request, Response } from "express";
import { readFile } from "fs/promises";
import { join } from "path";
import { redis } from "../../config/redis";

interface TokenBucketOptions {
  maxTokens: number;
  refillRate: number;
  refillIntervalMs: number;
  getTokenCost: (req: Request) => number;
}

const buckets = new Map<string, TokenBucketOptions>();

function defineBucket(name: string, options: TokenBucketOptions) {
  buckets.set(name, options);
}

function getBucket(name: string): TokenBucketOptions | undefined {
  return buckets.get(name);
}

// Atomic Lua script: read → refill → check → deduct in one Redis transaction
// Prevents TOCTOU race condition where concurrent requests both read stale state
const TOKEN_BUCKET_SCRIPT = await readFile(
  join(import.meta.dirname, "../../scripts/token-bucket.lua"),
  "utf-8",
);

async function consumeTokens(
  userId: string,
  bucketName: string,
  cost: number,
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const bucket = getBucket(bucketName);
  if (!bucket) {
    return { allowed: true, retryAfterMs: 0 };
  }

  const key = `token_bucket:${bucketName}:${userId}`;
  const now = Date.now();

  const result = (await redis.eval(TOKEN_BUCKET_SCRIPT, {
    keys: [key],
    arguments: [
      cost.toString(),
      bucket.maxTokens.toString(),
      bucket.refillIntervalMs.toString(),
      bucket.refillRate.toString(),
      now.toString(),
    ],
  })) as [number, number];

  return {
    allowed: result[0] === 1,
    retryAfterMs: result[1],
  };
}

function tokenBucketRateLimiter(bucketName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cost = getBucket(bucketName)?.getTokenCost(req) ?? 1;
      const result = await consumeTokens(req.userId, bucketName, cost);

      if (!result.allowed) {
        res.status(429).json({
          message: "Too many uploads. Please slow down.",
          retryAfterMs: result.retryAfterMs,
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export { defineBucket, getBucket, tokenBucketRateLimiter };