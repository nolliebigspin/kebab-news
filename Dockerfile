# Ingest worker — long-running Bun process.
# This Dockerfile lives at the REPO ROOT on purpose: the worker depends on the
# workspace packages (packages/*), so the build context must be the repo root.
# Keeping the Dockerfile at the root makes every Docker-build front-end (incl.
# Dokploy) use the root as context automatically, regardless of context-path
# settings.
#   docker build -t kebab-worker .
# In Dokploy: Build Type = Dockerfile, Docker File = Dockerfile, Context = .
FROM oven/bun:1.3.11 AS base
WORKDIR /app

# Install dependencies for the whole workspace (the worker pulls in
# @kebab/core, @kebab/db, @kebab/env). Copying every package manifest first
# lets Docker cache the install layer across source-only changes.
#
# ALL workspace manifests must be present — bun.lock is workspace-wide, so a
# missing member (e.g. apps/web) makes --frozen-lockfile see the topology as
# changed and abort. We copy apps/web's package.json (manifest only, not its
# source) for that reason.
COPY package.json bun.lock ./
COPY packages/env/package.json packages/env/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/core/package.json packages/core/package.json
COPY apps/web/package.json apps/web/package.json
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
