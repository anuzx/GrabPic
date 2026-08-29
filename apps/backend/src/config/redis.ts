import { createClient } from "redis";
import { config } from "./env";

const redis = createClient({
  url: config.redis_url || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) return new Error("Redis max retries reached");
      return Math.min(retries * 100, 3000); // exponential backoff, max 3s
    },
  },
});

redis.on("error", (err) => console.log("Redis Client Error", err));
redis.on("ready", () => console.log("Redis connected"));

await redis.connect();

export { redis };
