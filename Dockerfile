# syntax=docker/dockerfile:1.6

################################################################################
# Base image with shared configuration
################################################################################
FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    npm_config_cache=/tmp/npm-cache

################################################################################
# Install all dependencies (including dev) for building
################################################################################
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
RUN npm ci

################################################################################
# Build the Next.js application
################################################################################
FROM deps AS builder
COPY . .
RUN npm run build

################################################################################
# Prepare production node_modules (pruned from dev deps)
################################################################################
FROM deps AS prod-deps
RUN npm prune --omit=dev

################################################################################
# Final runtime image
################################################################################
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
RUN apk add --no-cache libc6-compat openssl

# Copy production dependencies and build artifacts
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/env.js ./src/env.js

EXPOSE 3000
CMD ["npm", "run", "start"]
