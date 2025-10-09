#!/bin/sh
set -e

echo "🚀 Docker Database Initialization Script"
echo "========================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "📦 Step 1: Generating Prisma Client..."
npx prisma generate

echo "🔄 Step 2: Running database migrations..."
npx prisma migrate deploy

echo "🌱 Step 3: Running database seed..."
npm run db:seed

echo "✅ Database initialization completed successfully!"
echo "========================================"

