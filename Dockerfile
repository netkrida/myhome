# syntax=docker/dockerfile:1.6

################################################################################
# Base image
################################################################################
FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    npm_config_cache=/tmp/npm-cache

################################################################################
# Install dependencies
################################################################################
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --ignore-scripts
RUN npx prisma generate

################################################################################
# Build Next.js application
################################################################################
FROM deps AS builder
# Skip env validation at build time - environment will be validated at runtime
ENV SKIP_ENV_VALIDATION=1 \
    NODE_ENV=production \
    DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder" \
    AUTH_SECRET="placeholder-secret-for-build-only" \
    NEXTAUTH_URL="http://placeholder.com"
COPY . .
RUN npm run build

################################################################################
# Runtime image
################################################################################
FROM node:20-alpine AS runner
WORKDIR /app
# Runtime environment - env validation will happen here
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOST=0.0.0.0 \
    PORT=3000
# Remove SKIP_ENV_VALIDATION so environment is validated at runtime

RUN apk add --no-cache libc6-compat openssl

# Non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Copy startup scripts
COPY --from=builder /app/scripts/validate-env.js ./scripts/
COPY --from=builder /app/scripts/start-app.js ./scripts/

USER nextjs
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start Next.js server with environment validation
CMD ["node", "scripts/start-app.js"]
