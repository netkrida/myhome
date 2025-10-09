#!/usr/bin/env sh
set -e

echo "============================================"
echo "� Booting MyHome Container"
echo "============================================"
echo "📝 Environment: NODE_ENV=${NODE_ENV:-production}"
echo "📝 Port: ${PORT:-3000}"
echo ""

# Validate DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set."
  echo "   Please configure DATABASE_URL in Dockploy environment variables."
  exit 1
fi

echo "✅ DATABASE_URL is configured"
echo "   Connection: ${DATABASE_URL:0:35}..." # Show first 35 chars for security
echo ""

# Wait for PostgreSQL to be ready
echo "============================================"
echo "⏳ Waiting for PostgreSQL..."
echo "============================================"
MAX_RETRIES=30
RETRY_COUNT=0

until echo "SELECT 1" | npx prisma db execute --stdin > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ PostgreSQL is not available after ${MAX_RETRIES} attempts"
    echo "   Please check:"
    echo "   - Database service is running"
    echo "   - DATABASE_URL is correct"
    echo "   - Network connectivity between containers"
    exit 1
  fi
  echo "⏳ PostgreSQL is unavailable (attempt ${RETRY_COUNT}/${MAX_RETRIES}) - retrying in 2s..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"
echo ""

# Step 1: Prisma Generate
echo "============================================"
echo "📦 Step 1: Generating Prisma Client..."
echo "============================================"
npx prisma generate

if [ $? -eq 0 ]; then
  echo "✅ Prisma Client generated successfully!"
else
  echo "❌ Prisma generate failed!"
  exit 1
fi
echo ""

# Step 2: Database Schema Sync (migrate or push)
echo "============================================"
echo "📦 Step 2: Syncing Database Schema..."
echo "============================================"

# Check if migrations directory exists and has migration files
if [ -d "./prisma/migrations" ] && [ -n "$(ls -A ./prisma/migrations 2>/dev/null | grep -v migration_lock.toml)" ]; then
  echo "📂 Migrations found. Running prisma migrate deploy..."
  npx prisma migrate deploy

  if [ $? -eq 0 ]; then
    echo "✅ Migrations applied successfully!"
  else
    echo "❌ Migration failed!"
    exit 1
  fi
else
  echo "📂 No migrations found. Running prisma db push..."
  npx prisma db push --accept-data-loss

  if [ $? -eq 0 ]; then
    echo "✅ Database schema pushed successfully!"
  else
    echo "❌ Database push failed!"
    exit 1
  fi
fi
echo ""

# Step 3: Database Seeding
echo "============================================"
echo "🌱 Step 3: Seeding Database..."
echo "============================================"

# Check if seed script exists in package.json
if npm run | grep -q "db:seed"; then
  echo "🌱 Running seed via npm run db:seed..."
  npm run db:seed || {
    echo "⚠️  Seed failed (this is OK if data already exists)"
    echo "   Continuing with application startup..."
  }
elif grep -q '"prisma"[[:space:]]*:' package.json && grep -q '"seed"' package.json; then
  echo "🌱 Running seed via npx prisma db seed..."
  npx prisma db seed || {
    echo "⚠️  Seed failed (this is OK if data already exists)"
    echo "   Continuing with application startup..."
  }
else
  echo "ℹ️  No seed script configured. Skipping seeding."
fi
echo ""

# Step 4: Start Application
echo "============================================"
echo "🚀 Step 4: Starting Application..."
echo "============================================"

# Determine start command
if npm run | grep -q "start:docker"; then
  echo "🎯 Starting with: npm run start:docker"
  exec npm run start:docker
elif npm run | grep -q "^start$"; then
  echo "🎯 Starting with: npm run start"
  exec npm run start
elif [ -f "./server.js" ]; then
  echo "🎯 Starting with: node server.js"
  exec node server.js
elif [ -f "./dist/main.js" ]; then
  echo "🎯 Starting with: node dist/main.js"
  exec node dist/main.js
else
  echo "❌ ERROR: No start command found!"
  echo "   Please ensure package.json has a 'start' script."
  exit 1
fi
