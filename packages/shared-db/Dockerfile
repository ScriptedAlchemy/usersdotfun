FROM oven/bun:1.2-alpine AS base

FROM base AS pruner
WORKDIR /app
COPY package.json bun.lock ./
COPY tsconfig.json ./
COPY apps/ /app/apps/
COPY packages/ /app/packages/

FROM base AS builder
WORKDIR /app
COPY --from=pruner /app .
RUN bun install
ENV NODE_ENV="production"
RUN bun run build --filter "@usersdotfun/shared-db"

FROM oven/bun:1.2-alpine AS production
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/package.json ./package.json
COPY --from=builder --chown=app:app /app/bun.lock ./bun.lock
COPY --from=builder --chown=app:app /app/packages/shared-db ./packages/shared-db

USER app
WORKDIR /app/packages/shared-db

# Run the migration and then go to sleep
ENTRYPOINT ["/bin/sh", "-c", "bun run db:migrate && sleep infinity"]
