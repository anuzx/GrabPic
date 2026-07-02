import { app } from "./app.js";
import { config } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "db";
import { redis } from "./config/redis.js";

const port = Number(config.port);

const server = app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    await prisma.$disconnect();
    await redis.quit();

    logger.info("Database disconnected");
    logger.info("Redis disconnected");

    process.exit(0);
  });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("uncaughtException", (error) => {
  logger.error(error);

  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error(reason);

  process.exit(1);
});
