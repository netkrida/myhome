#!/bin/sh
set -e

echo "🔧 Docker Database Reset Script"
echo "================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "📦 Step 1: Generating Prisma Client..."
npx prisma generate

echo "🗑️  Step 2: Resetting database (drop all tables and recreate)..."
npx prisma migrate reset --force --skip-seed

echo "🌱 Step 3: Running database seed..."
npm run db:seed

echo "✅ Database reset and seed completed successfully!"
echo "================================"

