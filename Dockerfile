# syntax=docker/dockerfile:1.6

# Base image with shared configuration
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies with caching support
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
COPY prisma ./prisma          
RUN npm ci --include=dev


# Build the Next.js application using the standalone output
FROM base AS builder
ENV SKIP_ENV_VALIDATION=true
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production runtime image
FROM base AS runner
RUN apk add --no-cache curl
WORKDIR /app
ENV PORT=3000
ENV HOST=0.0.0.0

COPY package.json package-lock.json* ./
COPY --from=deps /app/node_modules ./node_modules
# Copy the standalone build output and required assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Ensure the lightweight runtime runs as non-root
USER node
EXPOSE 3000

CMD ["node", "server.js"]
