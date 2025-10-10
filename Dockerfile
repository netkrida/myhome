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
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --include=dev
RUN npx prisma generate

# Build the Next.js application
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

# ✅ Control flags dengan default values
ENV SKIP_PRISMA_GENERATE=false
ENV SKIP_DB_MIGRATION=false
ENV SKIP_DB_SEED=false

RUN mkdir -p /app && chown -R node:node /app

COPY --chown=node:node package.json package-lock.json* ./
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static

RUN npm install --global --save-exact "prisma@$(node --print 'require("./node_modules/@prisma/client/package.json").version')"

USER node
EXPOSE 3000

# ✅ UPDATED: Conditional startup dengan skip logic
CMD sh -c '\
  echo "============================================" && \
  echo "🚀 Booting MyHome Container" && \
  echo "============================================" && \
  echo "📝 Environment: NODE_ENV=${NODE_ENV:-production}" && \
  echo "📝 Port: ${PORT:-3000}" && \
  echo "📝 Skip Prisma Generate: ${SKIP_PRISMA_GENERATE:-false}" && \
  echo "📝 Skip DB Migration: ${SKIP_DB_MIGRATION:-false}" && \
  echo "📝 Skip DB Seed: ${SKIP_DB_SEED:-false}" && \
  echo "" && \
  \
  if [ -z "$DATABASE_URL" ]; then \
    echo "❌ ERROR: DATABASE_URL is not set." && \
    exit 1; \
  fi && \
  \
  echo "✅ DATABASE_URL is configured" && \
  echo "" && \
  \
  if [ "$SKIP_PRISMA_GENERATE" != "true" ]; then \
    echo "============================================" && \
    echo "📦 Step 1: Generating Prisma Client..." && \
    echo "============================================" && \
    npx prisma generate && \
    echo "✅ Prisma Client generated successfully!" && \
    echo ""; \
  else \
    echo "⏭️  Skipping Prisma Client generation (SKIP_PRISMA_GENERATE=true)" && \
    echo ""; \
  fi && \
  \
  if [ "$SKIP_DB_MIGRATION" != "true" ]; then \
    echo "============================================" && \
    echo "📦 Step 2: Syncing Database Schema..." && \
    echo "============================================" && \
    if [ -d "./prisma/migrations" ] && [ -n "$(ls -A ./prisma/migrations 2>/dev/null | grep -v migration_lock.toml)" ]; then \
      echo "📂 Migrations found. Running prisma migrate deploy..." && \
      npx prisma migrate deploy && \
      echo "✅ Migrations applied successfully!"; \
    else \
      echo "📂 No migrations found. Running prisma db push..." && \
      npx prisma db push --accept-data-loss && \
      echo "✅ Database schema pushed successfully!"; \
    fi && \
    echo ""; \
  else \
    echo "⏭️  Skipping database migration (SKIP_DB_MIGRATION=true)" && \
    echo ""; \
  fi && \
  \
  if [ "$SKIP_DB_SEED" != "true" ]; then \
    echo "============================================" && \
    echo "🌱 Step 3: Seeding Database..." && \
    echo "============================================" && \
    if npm run | grep -q "db:seed"; then \
      echo "🌱 Running seed via npm run db:seed..." && \
      (npm run db:seed || echo "⚠️  Seed failed (this is OK if data already exists)"); \
    else \
      echo "ℹ️  No seed script configured. Skipping seeding."; \
    fi && \
    echo ""; \
  else \
    echo "⏭️  Skipping database seeding (SKIP_DB_SEED=true)" && \
    echo ""; \
  fi && \
  \
  echo "============================================" && \
  echo "🚀 Step 4: Starting Application..." && \
  echo "============================================" && \
  if npm run | grep -q "start:docker"; then \
    echo "🎯 Starting with: npm run start:docker" && \
    exec npm run start:docker; \
  else \
    echo "❌ ERROR: No start:docker command found!" && \
    exit 1; \
  fi \
'