import type { NextFunction, Request, Response } from "express";
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

  const data = await redis.hGetAll(key);
  let tokens = bucket.maxTokens;
  let lastRefill = now;

  if (data.tokens && data.lastRefill) {
    tokens = parseFloat(data.tokens);
    lastRefill = parseInt(data.lastRefill, 10);
    const elapsed = now - lastRefill;
    const refillAmount = Math.floor(elapsed / bucket.refillIntervalMs) * bucket.refillRate;
    if (refillAmount > 0) {
      tokens = Math.min(bucket.maxTokens, tokens + refillAmount);
      lastRefill = now;
    }
  }

  if (tokens < cost) {
    const waitMs = lastRefill + bucket.refillIntervalMs - now;
    return { allowed: false, retryAfterMs: Math.max(1, waitMs) };
  }

  tokens -= cost;
  await redis.hSet(key, { tokens: tokens.toString(), lastRefill: lastRefill.toString() });
  await redis.expire(key, Math.ceil(bucket.refillIntervalMs * bucket.maxTokens / 1000) + 1);

  return { allowed: true, retryAfterMs: 0 };
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