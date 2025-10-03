#!/bin/bash

# Domain Management Script for MyHome
# Manages domain configuration and SSL for myhome.co.id

set -e

DOMAIN="myhome.co.id"
APP_PORT="3000"

echo "🌐 MyHome Domain Management"
echo "=========================="
echo "Domain: $DOMAIN"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check domain DNS
check_dns() {
    print_status "Checking DNS configuration for $DOMAIN..."
    
    # Get server IP
    SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "Unable to detect")
    print_status "Server IP: $SERVER_IP"
    
    # Check domain resolution
    DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
    
    if [ -z "$DOMAIN_IP" ]; then
        print_error "Domain $DOMAIN does not resolve to any IP!"
        print_status "Please configure DNS A record:"
        echo "  Type: A"
        echo "  Name: @ (or myhome)"
        echo "  Value: $SERVER_IP"
        echo "  TTL: 300"
        return 1
    else
        print_success "Domain resolves to: $DOMAIN_IP"
        
        if [ "$DOMAIN_IP" = "$SERVER_IP" ]; then
            print_success "DNS is correctly configured!"
        else
            print_warning "Domain points to different IP than server!"
            echo "  Domain IP: $DOMAIN_IP"
            echo "  Server IP: $SERVER_IP"
        fi
    fi
}

# Setup Nginx reverse proxy
setup_nginx() {
    print_status "Setting up Nginx reverse proxy..."
    
    # Create nginx directory
    mkdir -p nginx
    
    # Create Nginx configuration
    cat > nginx/myhome.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL Security Headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:$APP_PORT/api/health;
        access_log off;
    }
    
    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:$APP_PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Favicon
    location /favicon.ico {
        proxy_pass http://localhost:$APP_PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    print_success "Nginx configuration created: nginx/myhome.conf"
    
    # Instructions for manual setup
    echo ""
    print_status "To install Nginx configuration:"
    echo "1. sudo cp nginx/myhome.conf /etc/nginx/sites-available/"
    echo "2. sudo ln -s /etc/nginx/sites-available/myhome.conf /etc/nginx/sites-enabled/"
    echo "3. sudo nginx -t"
    echo "4. sudo systemctl reload nginx"
}

# Setup SSL with Certbot
setup_ssl() {
    print_status "SSL Certificate setup instructions..."
    
    echo ""
    echo "🔒 SSL Certificate Setup:"
    echo "========================"
    echo ""
    echo "1. Install Certbot:"
    echo "   sudo apt update"
    echo "   sudo apt install certbot python3-certbot-nginx"
    echo ""
    echo "2. Obtain SSL certificate:"
    echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    echo ""
    echo "3. Test auto-renewal:"
    echo "   sudo certbot renew --dry-run"
    echo ""
    echo "4. Setup auto-renewal cron job:"
    echo "   sudo crontab -e"
    echo "   Add: 0 12 * * * /usr/bin/certbot renew --quiet"
}

# Create docker-compose with domain
create_docker_compose_domain() {
    print_status "Creating docker-compose with domain configuration..."
    
    cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=\${DATABASE_URL}
      - DIRECT_URL=\${DIRECT_URL}
      - AUTH_SECRET=\${AUTH_SECRET}
      - NEXTAUTH_URL=https://$DOMAIN
      - AUTH_DISCORD_ID=\${AUTH_DISCORD_ID}
      - AUTH_DISCORD_SECRET=\${AUTH_DISCORD_SECRET}
      - NEXT_PUBLIC_APP_NAME=MyHome
      - HOST=0.0.0.0
      - PORT=3000
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - app-network

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: \${POSTGRES_DB:-db_myhome}
      POSTGRES_USER: \${POSTGRES_USER:-myhome}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER:-myhome} -d \${POSTGRES_DB:-db_myhome}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - app-network

volumes:
  postgres_data:
    driver: local

networks:
  app-network:
    driver: bridge
EOF
    
    print_success "Production docker-compose created: docker-compose.prod.yml"
}

# Test domain connectivity
test_domain() {
    print_status "Testing domain connectivity..."
    
    # Test HTTP
    if curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN | grep -q "200\|301\|302"; then
        print_success "HTTP connection to $DOMAIN works!"
    else
        print_warning "HTTP connection to $DOMAIN failed"
    fi
    
    # Test HTTPS (if available)
    if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200"; then
        print_success "HTTPS connection to $DOMAIN works!"
    else
        print_warning "HTTPS connection to $DOMAIN failed (SSL may not be configured)"
    fi
    
    # Test application health
    if curl -s https://$DOMAIN/api/health | grep -q "OK"; then
        print_success "Application health check passed!"
    else
        print_warning "Application health check failed"
    fi
}

# Show domain status
show_status() {
    echo ""
    print_success "🌐 Domain Status for $DOMAIN"
    echo "============================="
    echo ""
    
    # DNS Status
    check_dns
    echo ""
    
    # Application Status
    if docker-compose ps | grep -q "Up"; then
        print_success "✅ Application is running"
    else
        print_warning "⚠️  Application is not running"
    fi
    
    # URLs
    echo ""
    echo "🔗 URLs:"
    echo "========"
    echo "• Production: https://$DOMAIN"
    echo "• Local: http://localhost:3000"
    echo "• Health: https://$DOMAIN/api/health"
    echo ""
    
    # Next Steps
    echo "📋 Next Steps:"
    echo "=============="
    echo "1. Ensure DNS points to this server"
    echo "2. Setup Nginx reverse proxy"
    echo "3. Configure SSL certificate"
    echo "4. Test domain connectivity"
}

# Main menu
main() {
    case "${1:-status}" in
        "dns")
            check_dns
            ;;
        "nginx")
            setup_nginx
            ;;
        "ssl")
            setup_ssl
            ;;
        "compose")
            create_docker_compose_domain
            ;;
        "test")
            test_domain
            ;;
        "status"|*)
            show_status
            ;;
    esac
}

# Show usage if no arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  status  - Show domain status (default)"
    echo "  dns     - Check DNS configuration"
    echo "  nginx   - Setup Nginx configuration"
    echo "  ssl     - Show SSL setup instructions"
    echo "  compose - Create production docker-compose"
    echo "  test    - Test domain connectivity"
    echo ""
fi

main "$@"
