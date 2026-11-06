# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=22.23.4

# pnpm 12 is a native binary. Keep this tag in step with packageManager in
# package.json, and update the digest with it.
FROM ghcr.io/pnpm/pnpm:12.17.0@sha256:172468925f0ca368313c09867081a43e298eaeb13dee8f7e4356bfad45dd8b15 AS pnpm

FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

COPY --from=pnpm /opt/pnpm /opt/pnpm
RUN ln -s /opt/pnpm/pnpm /usr/local/bin/pnpm

# Compile better-sqlite3 from its integrity-checked source against this image's
# Node headers. A downloaded prebuilt binary is covered by neither the lockfile
# nor the release-age policy.
ENV npm_config_build_from_source=better-sqlite3 \
    npm_config_nodedir=/usr/local

# Install node modules. pnpm ignores NODE_ENV, so this includes devDependencies.
# The store stays outside /app, so it never reaches the final image.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --store-dir /pnpm-store

# Copy application code
COPY . .

# Build application
RUN pnpm run build

# Remove development dependencies
RUN pnpm prune --prod --store-dir /pnpm-store


# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app/pnpm-lock.yaml /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server-dist ./server-dist
COPY --from=build /app/src/data/contests ./src/data/contests

# Setup sqlite3 on a separate volume
RUN mkdir -p /data
VOLUME /data
ENV DATABASE_PATH="/data/eurovision-ranker.sqlite"

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "npm", "run", "start" ]
