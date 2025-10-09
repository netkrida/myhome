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

# Ensure the lightweight runtime runs as non-root
USER node
EXPOSE 3000

# Use shell form to run multiple commands
CMD sh -c '\
  echo "============================================" && \
  echo "🚀 Booting MyHome Container" && \
  echo "============================================" && \
  echo "📝 Environment: NODE_ENV=${NODE_ENV:-production}" && \
  echo "📝 Port: ${PORT:-3000}" && \
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
  echo "============================================" && \
  echo "📦 Step 1: Generating Prisma Client..." && \
  echo "============================================" && \
  npx prisma generate && \
  echo "✅ Prisma Client generated successfully!" && \
  echo "" && \
  \
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
  echo "" && \
  \
  echo "============================================" && \
  echo "🌱 Step 3: Seeding Database..." && \
  echo "============================================" && \
  if npm run | grep -q "db:seed"; then \
    echo "🌱 Running seed via npm run db:seed..." && \
    (npm run db:seed || echo "⚠️  Seed failed (this is OK if data already exists)"); \
  elif grep -q "\"prisma\"" package.json && grep -q "\"seed\"" package.json; then \
    echo "🌱 Running seed via npx prisma db seed..." && \
    (npx prisma db seed || echo "⚠️  Seed failed (this is OK if data already exists)"); \
  else \
    echo "ℹ️  No seed script configured. Skipping seeding."; \
  fi && \
  echo "" && \
  \
  echo "============================================" && \
  echo "🚀 Step 4: Starting Application..." && \
  echo "============================================" && \
  if npm run | grep -q "start:docker"; then \
    echo "🎯 Starting with: npm run start:docker" && \
    exec npm run start:docker; \
  elif npm run | grep -q "^start$"; then \
    echo "🎯 Starting with: npm run start" && \
    exec npm run start; \
  elif [ -f "./server.js" ]; then \
    echo "🎯 Starting with: node server.js" && \
    exec node server.js; \
  else \
    echo "❌ ERROR: No start command found!" && \
    exit 1; \
  fi \
'
