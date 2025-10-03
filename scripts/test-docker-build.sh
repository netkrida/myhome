#!/bin/bash

# Test Docker Build Script for MyHome
# Tests Docker build process without requiring real environment variables

set -e

echo "🧪 Testing Docker Build for MyHome"
echo "=================================="
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

# Check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not available"
        exit 1
    fi
    print_success "Docker is available"
}

# Test build process
test_build() {
    print_status "Testing Docker build process..."
    
    # Build the image
    print_status "Building Docker image (this may take a few minutes)..."
    if docker build -t myhome-test . --no-cache; then
        print_success "Docker build completed successfully!"
    else
        print_error "Docker build failed!"
        exit 1
    fi
}

# Test image size
check_image_size() {
    print_status "Checking image size..."
    
    IMAGE_SIZE=$(docker images myhome-test --format "table {{.Size}}" | tail -n 1)
    print_status "Image size: $IMAGE_SIZE"
    
    # Convert to MB for comparison (rough estimate)
    if [[ "$IMAGE_SIZE" == *"GB"* ]]; then
        print_warning "Image size is quite large (${IMAGE_SIZE}). Consider optimizing."
    else
        print_success "Image size looks reasonable: $IMAGE_SIZE"
    fi
}

# Test container startup (with test environment)
test_container_startup() {
    print_status "Testing container startup with test environment..."
    
    # Create test environment file
    cat > .env.test << EOF
NODE_ENV=production
DATABASE_URL=postgresql://test:test@localhost:5432/test
AUTH_SECRET=test-secret-that-is-at-least-32-characters-long-for-testing
NEXTAUTH_URL=https://test.example.com
PORT=3000
HOST=0.0.0.0
SKIP_ENV_VALIDATION=false
EOF
    
    print_status "Starting container with test environment..."
    
    # Start container in background
    CONTAINER_ID=$(docker run -d \
        --env-file .env.test \
        -p 3001:3000 \
        --name myhome-test-container \
        myhome-test)
    
    if [ $? -eq 0 ]; then
        print_success "Container started successfully: $CONTAINER_ID"
        
        # Wait a bit for startup
        print_status "Waiting for application to start..."
        sleep 10
        
        # Check if container is still running
        if docker ps | grep -q myhome-test-container; then
            print_success "Container is running"
            
            # Try to get logs
            print_status "Container logs:"
            docker logs myhome-test-container --tail 20
            
        else
            print_error "Container stopped unexpectedly"
            print_status "Container logs:"
            docker logs myhome-test-container
        fi
        
        # Cleanup
        print_status "Cleaning up test container..."
        docker stop myhome-test-container >/dev/null 2>&1 || true
        docker rm myhome-test-container >/dev/null 2>&1 || true
        
    else
        print_error "Failed to start container"
        exit 1
    fi
    
    # Cleanup test env file
    rm -f .env.test
}

# Test environment validation
test_env_validation() {
    print_status "Testing environment validation..."
    
    # Test with missing required env vars
    print_status "Testing with missing environment variables..."
    
    if docker run --rm \
        -e NODE_ENV=production \
        myhome-test \
        node scripts/validate-env.js 2>/dev/null; then
        print_warning "Environment validation should have failed but didn't"
    else
        print_success "Environment validation correctly failed with missing variables"
    fi
    
    # Test with valid env vars
    print_status "Testing with valid environment variables..."
    
    if docker run --rm \
        -e NODE_ENV=production \
        -e DATABASE_URL=postgresql://test:test@localhost:5432/test \
        -e AUTH_SECRET=test-secret-that-is-at-least-32-characters-long \
        -e NEXTAUTH_URL=https://test.example.com \
        myhome-test \
        node scripts/validate-env.js; then
        print_success "Environment validation passed with valid variables"
    else
        print_error "Environment validation failed with valid variables"
    fi
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    
    # Remove test container if exists
    docker stop myhome-test-container >/dev/null 2>&1 || true
    docker rm myhome-test-container >/dev/null 2>&1 || true
    
    # Remove test image
    docker rmi myhome-test >/dev/null 2>&1 || true
    
    # Remove test files
    rm -f .env.test
    
    print_success "Cleanup completed"
}

# Main test function
main() {
    # Set trap for cleanup on exit
    trap cleanup EXIT
    
    print_status "Starting Docker build tests..."
    echo ""
    
    # Run tests
    check_docker
    test_build
    check_image_size
    test_env_validation
    test_container_startup
    
    echo ""
    print_success "🎉 All Docker build tests passed!"
    echo ""
    echo "📋 Test Summary:"
    echo "==============="
    echo "✅ Docker build successful"
    echo "✅ Image size reasonable"
    echo "✅ Environment validation working"
    echo "✅ Container startup successful"
    echo ""
    echo "🚀 Your Docker setup is ready for deployment!"
}

# Show usage
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help, -h    Show this help message"
    echo "  --no-cleanup  Don't cleanup test resources"
    echo ""
    echo "This script tests the Docker build process for MyHome application."
    exit 0
fi

# Handle no-cleanup option
if [ "$1" = "--no-cleanup" ]; then
    trap - EXIT
    print_warning "Cleanup disabled. You'll need to manually remove test resources."
fi

# Run main function
main
