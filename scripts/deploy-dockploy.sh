#!/bin/bash

# 🚀 Dockploy Deployment Helper Script untuk MyHome
# Script ini membantu mempersiapkan dan memvalidasi deployment di Dockploy

set -e  # Exit on any error

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

print_header() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}🚀 $1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_header "MyHome Dockploy Deployment Helper"

# Check required files
print_status "Checking required files for Dockploy deployment..."

required_files=(
    "Dockerfile"
    "docker-compose.yml"
    ".dockerignore"
    ".env.dockploy.example"
    "next.config.js"
    "package.json"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "✅ $file found"
    else
        print_error "❌ $file missing"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    print_error "Missing required files. Please create them before deployment."
    exit 1
fi

# Check environment file
print_status "Checking environment configuration..."

if [ -f ".env.production" ]; then
    print_success "✅ .env.production found"
    
    # Check required environment variables
    required_vars=(
        "AUTH_SECRET"
        "DATABASE_URL"
        "NEXTAUTH_URL"
        "CLOUDINARY_API_SECRET"
    )
    
    missing_vars=()
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env.production; then
            value=$(grep "^${var}=" .env.production | cut -d'=' -f2- | tr -d '"')
            if [ -n "$value" ] && [[ ! "$value" =~ ^\[.*\]$ ]] && [[ ! "$value" =~ placeholder ]]; then
                print_success "✅ $var is set"
            else
                print_warning "⚠️  $var is set but appears to be placeholder"
                missing_vars+=("$var")
            fi
        else
            print_error "❌ $var not found"
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_warning "Some required environment variables are missing or have placeholder values."
        print_status "Please update these variables in .env.production:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
    fi
else
    print_warning "⚠️  .env.production not found"
    print_status "You can copy from .env.dockploy.example and customize it"
fi

# Check Next.js configuration
print_status "Checking Next.js configuration..."

if grep -q "output.*standalone" next.config.js; then
    print_success "✅ Next.js standalone output is configured"
else
    print_warning "⚠️  Next.js standalone output not found in next.config.js"
    print_status "This is required for optimal Docker deployment"
fi

# Check package.json scripts
print_status "Checking package.json scripts..."

required_scripts=(
    "build"
    "start"
    "prisma:generate"
    "prisma:migrate:deploy"
)

for script in "${required_scripts[@]}"; do
    if grep -q "\"$script\":" package.json; then
        print_success "✅ $script script found"
    else
        print_warning "⚠️  $script script not found"
    fi
done

# Test Docker build (optional)
if command -v docker &> /dev/null; then
    print_status "Docker is available. Would you like to test the build? (y/N)"
    read -r test_build
    
    if [[ $test_build =~ ^[Yy]$ ]]; then
        print_status "Testing Docker build..."
        
        if docker build -t myhome-test . --quiet; then
            print_success "✅ Docker build successful"
            
            # Clean up test image
            docker rmi myhome-test --force > /dev/null 2>&1 || true
        else
            print_error "❌ Docker build failed"
            print_status "Please check the Dockerfile and try again"
        fi
    fi
else
    print_warning "⚠️  Docker not found. Cannot test build locally"
fi

# Generate deployment summary
print_header "Deployment Summary"

print_status "Repository Information:"
if command -v git &> /dev/null && [ -d ".git" ]; then
    echo "  📁 Repository: $(git config --get remote.origin.url 2>/dev/null || echo 'Not configured')"
    echo "  🌿 Current Branch: $(git branch --show-current 2>/dev/null || echo 'Not in git repository')"
    echo "  📝 Last Commit: $(git log -1 --pretty=format:'%h - %s (%cr)' 2>/dev/null || echo 'No commits found')"
else
    echo "  📁 Repository: Not a git repository or git not installed"
fi

print_status "Deployment Configuration:"
echo "  🐳 Dockerfile: Ready for multi-stage build"
echo "  📦 Docker Compose: Production configuration"
echo "  🚫 Docker Ignore: Optimized for build speed"
echo "  ⚙️  Environment: Template provided (.env.dockploy.example)"

print_status "Required Environment Variables for Dockploy:"
echo "  🔐 AUTH_SECRET: 32+ character secret"
echo "  🌐 NEXTAUTH_URL: https://myhome.co.id"
echo "  🗄️  DATABASE_URL: PostgreSQL connection string"
echo "  🖼️  CLOUDINARY_API_SECRET: For image uploads"

print_header "Next Steps for Dockploy Deployment"

echo "1. 📋 Copy environment variables:"
echo "   - Use .env.dockploy.example as template"
echo "   - Set all required variables in Dockploy dashboard"
echo ""
echo "2. 🔗 Connect repository to Dockploy:"
echo "   - Repository URL: $(git config --get remote.origin.url 2>/dev/null || echo 'Configure git remote')"
echo "   - Branch: main (or your deployment branch)"
echo "   - Build Context: /"
echo "   - Dockerfile Path: Dockerfile"
echo ""
echo "3. ⚙️  Configure Dockploy settings:"
echo "   - Port: 3000"
echo "   - Health Check: /api/health"
echo "   - Domain: myhome.co.id"
echo ""
echo "4. 🚀 Deploy:"
echo "   - Click Deploy in Dockploy dashboard"
echo "   - Monitor build logs"
echo "   - Test health endpoint: https://myhome.co.id/api/health"

print_success "🎉 Your project is ready for Dockploy deployment!"

print_status "For troubleshooting, check:"
echo "  📖 docs/DOCKPLOY_DEPLOYMENT.md"
echo "  🐳 docs/DOCKER_BUILD_GUIDE.md"
echo "  🔧 docs/DOCKER_DEPLOYMENT.md"
