#!/bin/bash

# Docker Setup Script for MultiKost Next.js Application
# This script helps setup the application for Docker deployment

set -e

echo "🚀 MultiKost Docker Setup Script"
echo "================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your actual values before proceeding."
    echo "   Important variables to set:"
    echo "   - AUTH_SECRET (generate with: npx auth secret)"
    echo "   - POSTGRES_PASSWORD"
    echo "   - DATABASE_URL"
    echo "   - DIRECT_URL"
    read -p "Press Enter after editing .env file..."
fi

# Ask for deployment type
echo ""
echo "🔧 Choose deployment type:"
echo "1) Development (database only)"
echo "2) Production (full stack)"
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo "🔨 Setting up development environment..."
        docker-compose -f docker-compose.dev.yml up -d
        echo "✅ Development database is running"
        echo "💡 Run 'npm run dev' to start the Next.js development server"
        ;;
    2)
        echo "🏗️  Building production environment..."
        
        # Build the application
        echo "📦 Building Docker image..."
        docker-compose build
        
        # Start services
        echo "🚀 Starting services..."
        docker-compose up -d
        
        # Wait for database to be ready
        echo "⏳ Waiting for database to be ready..."
        sleep 10
        
        # Run database migrations
        echo "🗄️  Running database migrations..."
        docker-compose exec web npm run prisma:migrate:deploy
        
        echo "✅ Production environment is ready!"
        echo "🌐 Application is running at http://localhost:3000"
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "📊 Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Restart services: docker-compose restart"
echo "  - Check health: curl http://localhost:3000/api/health"
echo ""
echo "🎉 Setup complete!"
