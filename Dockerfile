# syntax=docker/dockerfile:1.6

# Base image with shared configuration
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies with caching support
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Copy Prisma schema before installing dependencies
# This is needed for postinstall script (prisma generate)
COPY prisma ./prisma

# Install all dependencies (including devDependencies for build)
RUN npm ci --include=dev

# Generate Prisma Client
RUN npx prisma generate


# Build the Next.js application using the standalone output
FROM base AS builder
ENV SKIP_ENV_VALIDATION=true
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production runtime image
FROM base AS runner
RUN apk add --no-cache curl bash openssl tini
WORKDIR /app

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV CHECKPOINT_DISABLE=1
ENV DISABLE_PRISMA_TELEMETRY=true

# Create app directory and set ownership
RUN mkdir -p /app && chown -R node:node /app

# Copy package files
COPY --chown=node:node package.json package-lock.json* ./

# Copy node_modules from deps stage (includes Prisma Client)
COPY --chown=node:node --from=deps /app/node_modules ./node_modules

# Copy Prisma files for migrations at runtime
COPY --chown=node:node --from=builder /app/prisma ./prisma

# Copy the standalone build output and required assets
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static

# Install Prisma CLI globally with exact version matching @prisma/client
# This is needed for running migrations at container startup
RUN npm install --global --save-exact "prisma@$(node --print 'require("./node_modules/@prisma/client/package.json").version')"

# Copy entrypoint script
COPY --chown=node:node scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Ensure the lightweight runtime runs as non-root
USER node
EXPOSE 3000

# Use tini as init system for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/usr/local/bin/docker-entrypoint.sh"]
