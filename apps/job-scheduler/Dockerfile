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
ARG TARGET_APP_PACKAGE_NAME
ARG TARGET_APP_ROOT_PATH
RUN bun install --frozen-lockfile
ENV NODE_ENV="production"
RUN bun run build --filter "$TARGET_APP_PACKAGE_NAME"

FROM oven/bun:1.2-alpine AS production
ARG TARGET_APP_ROOT_PATH
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=builder --chown=app:app /app/$TARGET_APP_ROOT_PATH/dist ./$TARGET_APP_ROOT_PATH/dist
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/package.json ./package.json
COPY --from=builder --chown=app:app /app/bun.lock ./bun.lock
USER app
WORKDIR /app/$TARGET_APP_ROOT_PATH
CMD ["bun", "run", "start"]
