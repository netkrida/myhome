#!/bin/sh
set -e

echo "🔍 Starting database initialization..."

# Wait for postgres to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; do
  echo "⏳ PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully!"
else
  echo "❌ Migration failed!"
  exit 1
fi

# Run seed
echo "🌱 Running database seed..."
npm run db:seed

if [ $? -eq 0 ]; then
  echo "✅ Seed completed successfully!"
else
  echo "⚠️  Seed failed, but continuing..."
fi

# Start the application
echo "🚀 Starting application..."
exec node server.js
