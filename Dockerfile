# syntax=docker/dockerfile:1.6

# Base image with shared configuration
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies with caching support
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --include=dev
RUN npx prisma generate


# Build the Next.js application using the standalone output
FROM base AS builder
ENV SKIP_ENV_VALIDATION=true
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production runtime image
FROM base AS runner
RUN apk add --no-cache curl bash openssl
WORKDIR /app
ENV PORT=3000
ENV HOST=0.0.0.0

# Create app directory and set ownership
RUN mkdir -p /app && chown -R node:node /app

COPY --chown=node:node package.json package-lock.json* ./
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
# Copy the standalone build output and required assets
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static

# Copy entrypoint script
COPY --chown=node:node scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Ensure the lightweight runtime runs as non-root
USER node
EXPOSE 3000

CMD ["sh", "/usr/local/bin/docker-entrypoint.sh"]
