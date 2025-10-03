#!/bin/bash

# Production Deployment Script for MyHome
# Domain: myhome.co.id

set -e

echo "🚀 MyHome Production Deployment Script"
echo "======================================"
echo "Domain: myhome.co.id"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root (needed for some operations)
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root. This is okay for server deployment."
    fi
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed!"
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Setup environment file
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.example .env
        
        # Update with production values
        sed -i 's|NEXTAUTH_URL=".*"|NEXTAUTH_URL="https://myhome.co.id"|g' .env
        sed -i 's|NODE_ENV=".*"|NODE_ENV="production"|g' .env
        sed -i 's|NEXT_PUBLIC_APP_NAME=".*"|NEXT_PUBLIC_APP_NAME="MyHome"|g' .env
        
        print_warning "Please edit .env file with your production values:"
        echo "  - AUTH_SECRET (generate with: openssl rand -base64 32)"
        echo "  - Database credentials"
        echo "  - API keys (Cloudinary, Midtrans, etc.)"
        
        read -p "Press Enter after editing .env file..."
    fi
    
    # Validate required environment variables
    source .env
    
    if [ -z "$AUTH_SECRET" ] || [ "$AUTH_SECRET" = "your-auth-secret-here-minimum-32-characters" ]; then
        print_error "AUTH_SECRET is not set or using default value!"
        print_status "Generate one with: openssl rand -base64 32"
        exit 1
    fi
    
    if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "your_secure_password" ]; then
        print_error "POSTGRES_PASSWORD is not set or using default value!"
        exit 1
    fi
    
    print_success "Environment variables validated"
}

# Build and start services
deploy_services() {
    print_status "Building and deploying services..."
    
    # Stop existing services
    print_status "Stopping existing services..."
    docker-compose down --remove-orphans || true
    
    # Build new images
    print_status "Building Docker images..."
    docker-compose build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 15
    
    # Run database migrations
    print_status "Running database migrations..."
    docker-compose exec -T web npm run prisma:migrate:deploy || {
        print_warning "Migration failed, trying to generate and migrate..."
        docker-compose exec -T web npx prisma generate
        docker-compose exec -T web npm run prisma:migrate:deploy
    }
    
    print_success "Services deployed successfully!"
}

# Setup SSL/HTTPS (if using Nginx)
setup_ssl() {
    print_status "SSL setup information..."
    echo ""
    echo "For SSL/HTTPS with myhome.co.id:"
    echo "1. If using Dockploy: SSL is handled automatically"
    echo "2. If using manual deployment:"
    echo "   - Install Nginx as reverse proxy"
    echo "   - Use Certbot for Let's Encrypt SSL"
    echo "   - Configure Nginx to proxy to localhost:3000"
    echo ""
    echo "Sample Nginx config saved to: nginx/myhome.conf"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Wait a bit for services to fully start
    sleep 10
    
    # Check if containers are running
    if ! docker-compose ps | grep -q "Up"; then
        print_error "Some containers are not running!"
        docker-compose logs
        exit 1
    fi
    
    # Check application health endpoint
    print_status "Checking application health..."
    for i in {1..10}; do
        if curl -f http://localhost:3000/api/health &>/dev/null; then
            print_success "Application is healthy!"
            break
        else
            print_status "Waiting for application to be ready... (attempt $i/10)"
            sleep 5
        fi
        
        if [ $i -eq 10 ]; then
            print_error "Application health check failed!"
            print_status "Checking logs..."
            docker-compose logs web
            exit 1
        fi
    done
}

# Show deployment info
show_deployment_info() {
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📊 Deployment Information:"
    echo "=========================="
    echo "🌐 Domain: https://myhome.co.id"
    echo "🏠 Local: http://localhost:3000"
    echo "🔍 Health: http://localhost:3000/api/health"
    echo "📊 Status: docker-compose ps"
    echo "📋 Logs: docker-compose logs -f"
    echo ""
    echo "🔧 Management Commands:"
    echo "======================"
    echo "• Stop: docker-compose down"
    echo "• Restart: docker-compose restart"
    echo "• Update: git pull && ./scripts/deploy-production.sh"
    echo "• Backup DB: ./scripts/backup-database.sh"
    echo ""
    echo "🚨 Important Notes:"
    echo "=================="
    echo "• Make sure domain myhome.co.id points to this server"
    echo "• Configure firewall to allow ports 80, 443, 3000"
    echo "• Setup SSL certificate for production use"
    echo "• Regular database backups recommended"
}

# Main execution
main() {
    check_root
    check_prerequisites
    setup_environment
    deploy_services
    setup_ssl
    health_check
    show_deployment_info
}

# Run main function
main "$@"
