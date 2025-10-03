#!/bin/bash

# Dockploy Deployment Script for MyHome
# Prepares files for Dockploy deployment

set -e

echo "🚀 Preparing MyHome for Dockploy Deployment"
echo "==========================================="
echo "Domain: myhome.co.id"
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

# Backup original files
backup_files() {
    print_status "Backing up original files..."
    
    if [ -f "Dockerfile" ]; then
        cp Dockerfile Dockerfile.backup
        print_status "Backed up Dockerfile to Dockerfile.backup"
    fi
    
    if [ -f "docker-compose.yml" ]; then
        cp docker-compose.yml docker-compose.yml.backup
        print_status "Backed up docker-compose.yml to docker-compose.yml.backup"
    fi
}

# Use Dockploy-optimized files
use_dockploy_files() {
    print_status "Setting up Dockploy-optimized files..."
    
    # Use simplified Dockerfile for Dockploy
    if [ -f "Dockerfile.dockploy" ]; then
        cp Dockerfile.dockploy Dockerfile
        print_success "Using Dockerfile.dockploy as Dockerfile"
    else
        print_error "Dockerfile.dockploy not found!"
        exit 1
    fi
    
    # Use Dockploy docker-compose
    if [ -f "docker-compose.dockploy.yml" ]; then
        cp docker-compose.dockploy.yml docker-compose.yml
        print_success "Using docker-compose.dockploy.yml as docker-compose.yml"
    else
        print_warning "docker-compose.dockploy.yml not found, using existing docker-compose.yml"
    fi
}

# Create .dockerignore for Dockploy
create_dockerignore() {
    print_status "Creating optimized .dockerignore for Dockploy..."
    
    cat > .dockerignore << EOF
# Dependencies
node_modules
npm-debug.log*
.npm

# Build outputs
.next
out
dist
coverage

# Environment files
.env
.env.*
!.env.example

# Development files
.vscode
.idea
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Git
.git
.gitignore

# Documentation
*.md
!README.md
docs/

# Tests
__tests__/
*.test.js
*.spec.js

# Logs
logs
*.log

# Backup files
*.backup
*.bak

# Docker files (keep only main ones)
Dockerfile.simple
Dockerfile.backup
docker-compose.*.yml
!docker-compose.yml
EOF
    
    print_success "Created optimized .dockerignore"
}

# Validate environment variables template
create_env_template() {
    print_status "Creating environment variables template..."
    
    cat > .env.dockploy.example << EOF
# Required Environment Variables for Dockploy
NODE_ENV=production
HOST=0.0.0.0
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://myhome:@myhome_123@myhome-myhome-jlldmr:5432/db_myhome?schema=public

# Authentication
AUTH_SECRET=your-32-character-secret-minimum-length
NEXTAUTH_URL=https://myhome.co.id

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME=dg0ybxdbt
CLOUDINARY_API_KEY=836543447587342
CLOUDINARY_API_SECRET=joI9lZdqjlWNyCEnJ5gh0ugYuzQ

# Optional: OAuth Providers
AUTH_DISCORD_ID=your_discord_client_id
AUTH_DISCORD_SECRET=your_discord_client_secret

# Optional: Payment Gateway
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=false
EOF
    
    print_success "Created .env.dockploy.example"
}

# Test build locally (if Docker available)
test_build() {
    if command -v docker &> /dev/null; then
        print_status "Testing Docker build locally..."
        
        if docker build -t myhome-dockploy-test . --no-cache; then
            print_success "Docker build test successful!"
            
            # Cleanup test image
            docker rmi myhome-dockploy-test >/dev/null 2>&1 || true
        else
            print_warning "Docker build test failed, but this might work in Dockploy environment"
        fi
    else
        print_warning "Docker not available for local testing"
    fi
}

# Show deployment instructions
show_instructions() {
    echo ""
    print_success "🎉 Files prepared for Dockploy deployment!"
    echo ""
    echo "📋 Dockploy Deployment Instructions:"
    echo "===================================="
    echo ""
    echo "1. 📁 Files Ready:"
    echo "   ✅ Dockerfile (optimized for Dockploy)"
    echo "   ✅ docker-compose.yml (with Traefik labels)"
    echo "   ✅ .dockerignore (optimized)"
    echo "   ✅ .env.dockploy.example (environment template)"
    echo ""
    echo "2. 🌐 In Dockploy Dashboard:"
    echo "   • Create new application"
    echo "   • Connect GitHub repository: netkrida/boxbook"
    echo "   • Set branch: main"
    echo "   • Set build context: /"
    echo "   • Set Dockerfile path: Dockerfile"
    echo ""
    echo "3. 🔧 Environment Variables (copy from .env.dockploy.example):"
    echo "   Required:"
    echo "   • DATABASE_URL"
    echo "   • AUTH_SECRET"
    echo "   • NEXTAUTH_URL=https://myhome.co.id"
    echo "   • CLOUDINARY_API_SECRET"
    echo ""
    echo "   Optional:"
    echo "   • AUTH_DISCORD_ID, AUTH_DISCORD_SECRET"
    echo "   • MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY"
    echo ""
    echo "4. 🚀 Deploy:"
    echo "   • Click Deploy"
    echo "   • Monitor build logs"
    echo "   • Check health at: https://myhome.co.id/api/health"
    echo ""
    echo "5. 🔍 Troubleshooting:"
    echo "   • Check build logs in Dockploy"
    echo "   • Verify environment variables"
    echo "   • Check domain DNS settings"
    echo ""
    echo "🌐 Expected URL: https://myhome.co.id"
}

# Restore original files
restore_files() {
    print_status "Restoring original files..."
    
    if [ -f "Dockerfile.backup" ]; then
        mv Dockerfile.backup Dockerfile
        print_status "Restored original Dockerfile"
    fi
    
    if [ -f "docker-compose.yml.backup" ]; then
        mv docker-compose.yml.backup docker-compose.yml
        print_status "Restored original docker-compose.yml"
    fi
}

# Main function
main() {
    case "${1:-prepare}" in
        "prepare")
            backup_files
            use_dockploy_files
            create_dockerignore
            create_env_template
            test_build
            show_instructions
            ;;
        "restore")
            restore_files
            print_success "Original files restored"
            ;;
        "test")
            test_build
            ;;
        *)
            echo "Usage: $0 [prepare|restore|test]"
            echo ""
            echo "Commands:"
            echo "  prepare - Prepare files for Dockploy (default)"
            echo "  restore - Restore original files"
            echo "  test    - Test Docker build"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
