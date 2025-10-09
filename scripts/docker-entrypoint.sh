#!/bin/sh
set -e

echo "============================================"
echo "🔍 Starting database initialization..."
echo "============================================"

# Print environment info for debugging
echo "📝 Environment:"
echo "   NODE_ENV: ${NODE_ENV}"
echo "   DATABASE_URL: ${DATABASE_URL:0:30}..." # Only show first 30 chars for security

#!/bin/sh
set -e

echo "🔍 Starting database initialization..."

# Wait for postgres to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until echo "SELECT 1" | npx prisma db execute --stdin > /dev/null 2>&1; do
  echo "⏳ PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"
echo ""

# Run migrations
echo "============================================"
echo "📦 Running database migrations..."
echo "============================================"
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully!"
else
  echo "❌ Migration failed!"
  exit 1
fi

echo ""

# Run seed
echo "============================================"
echo "🌱 Running database seed..."
echo "============================================"
npm run db:seed

if [ $? -eq 0 ]; then
  echo "✅ Seed completed successfully!"
else
  echo "⚠️  Seed failed, but continuing..."
fi

echo ""
echo "============================================"
echo "🚀 Starting application..."
echo "============================================"
exec node server.js
