# Ingest worker — long-running Bun process.
# Build context is the REPO ROOT (the worker depends on workspace packages):
#   docker build -f apps/worker/Dockerfile -t kebab-worker .
# In Dokploy, set the build context to the repo root and the Dockerfile path
# to apps/worker/Dockerfile.
FROM oven/bun:1.3.11 AS base
WORKDIR /app

# Install dependencies for the whole workspace (the worker pulls in
# @kebab/core, @kebab/db, @kebab/env). Copying every package manifest first
# lets Docker cache the install layer across source-only changes.
COPY package.json bun.lock ./
COPY packages/env/package.json packages/env/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/core/package.json packages/core/package.json
COPY apps/worker/package.json apps/worker/package.json
RUN bun install --frozen-lockfile

# Source. Web app is intentionally excluded — the worker doesn't need it.
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker

ENV NODE_ENV=production
WORKDIR /app/apps/worker

# DATABASE_URL, ANTHROPIC_API_KEY, VOYAGE_API_KEY, VOTE_DAILY_SALT, CRON_SECRET
# are injected by Dokploy as environment variables at runtime.
CMD ["bun", "run", "src/index.ts"]
