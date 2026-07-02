import { createClient } from "redis";
import { config } from "./env";

const redis = await createClient({
  url: config.redis_url || "redis://localhost:6379",
})
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

export { redis };
