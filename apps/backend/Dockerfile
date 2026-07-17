FROM oven/bun:1.3.4 AS base
WORKDIR /app

COPY package.json bun.lock* ./
COPY apps/backend/package.json apps/backend/
COPY packages/db/package.json packages/db/
RUN bun install --frozen-lockfile

COPY packages/db/ packages/db/
COPY apps/backend/ apps/backend/

RUN cd packages/db && bunx prisma generate

WORKDIR /app/apps/backend
EXPOSE 5000
CMD ["sh", "-c", "cd /app/packages/db && bunx prisma migrate deploy && cd /app/apps/backend && bun run start"]
