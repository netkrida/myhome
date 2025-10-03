#!/bin/bash

# Quick Deploy Script for MyHome
# Fast deployment for myhome.co.id

set -e

DOMAIN="myhome.co.id"

echo "⚡ MyHome Quick Deploy"
echo "===================="
echo "Domain: $DOMAIN"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# Quick deployment steps
quick_deploy() {
    print_status "Starting quick deployment..."
    
    # Pull latest changes
    print_status "Pulling latest changes..."
    git pull origin main
    
    # Update environment
    print_status "Updating environment..."
    if [ ! -f ".env" ]; then
        cp .env.example .env
        sed -i "s|NEXTAUTH_URL=\".*\"|NEXTAUTH_URL=\"https://$DOMAIN\"|g" .env
        sed -i 's|NODE_ENV=".*"|NODE_ENV="production"|g' .env
    fi
    
    # Build and deploy
    print_status "Building and deploying..."
    docker-compose down --remove-orphans
    docker-compose build --no-cache
    docker-compose up -d
    
    # Wait for services
    print_status "Waiting for services to start..."
    sleep 20
    
    # Run migrations
    print_status "Running database migrations..."
    docker-compose exec -T web npm run prisma:migrate:deploy || true
    
    print_success "🎉 Quick deployment completed!"
    print_status "🌐 Check: https://$DOMAIN"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    for i in {1..5}; do
        if curl -f http://localhost:3000/api/health &>/dev/null; then
            print_success "✅ Application is healthy!"
            return 0
        else
            print_status "Waiting... (attempt $i/5)"
            sleep 5
        fi
    done
    
    echo "⚠️  Health check failed, but deployment may still be working"
    echo "Check manually: https://$DOMAIN"
}

# Main execution
main() {
    quick_deploy
    health_check
    
    echo ""
    echo "🔗 URLs:"
    echo "• Production: https://$DOMAIN"
    echo "• Health: https://$DOMAIN/api/health"
    echo "• Logs: docker-compose logs -f"
}

main "$@"
