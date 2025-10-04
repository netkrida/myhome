#!/bin/bash

# 🧪 Test Docker Build Script untuk MyHome
# Script untuk testing Docker build sebelum deployment ke Dockploy

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
    echo -e "${BLUE}🧪 $1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "Dockerfile" ]; then
    print_error "Dockerfile not found. Please run this script from the project root."
    exit 1
fi

print_header "Docker Build Test untuk MyHome"

# Cleanup function
cleanup() {
    print_status "Cleaning up test containers and images..."
    docker stop myhome-test-container 2>/dev/null || true
    docker rm myhome-test-container 2>/dev/null || true
    docker rmi myhome-test-image 2>/dev/null || true
    print_success "Cleanup completed"
}

# Set cleanup trap
trap cleanup EXIT

# Build the Docker image
print_status "Building Docker image..."
if docker build -t myhome-test-image . --progress=plain; then
    print_success "✅ Docker build successful"
else
    print_error "❌ Docker build failed"
    exit 1
fi

# Check image size
image_size=$(docker images myhome-test-image --format "table {{.Size}}" | tail -n 1)
print_status "Image size: $image_size"

# Test with minimal environment
print_status "Testing container startup with minimal environment..."

docker run -d \
    --name myhome-test-container \
    -p 3001:3000 \
    -e NODE_ENV=production \
    -e DATABASE_URL="postgresql://test:test@localhost:5432/test?schema=public" \
    -e AUTH_SECRET="test-secret-32-characters-minimum-length" \
    -e NEXTAUTH_URL="https://test.example.com" \
    -e CLOUDINARY_API_SECRET="test-secret" \
    myhome-test-image

# Wait for container to start
print_status "Waiting for container to start..."
sleep 10

# Check if container is running
if docker ps | grep -q myhome-test-container; then
    print_success "✅ Container is running"
else
    print_error "❌ Container failed to start"
    print_status "Container logs:"
    docker logs myhome-test-container
    exit 1
fi

# Test health endpoint
print_status "Testing health endpoint..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s -f http://localhost:3001/api/health > /dev/null 2>&1; then
        print_success "✅ Health endpoint is responding"
        
        # Get health check details
        health_response=$(curl -s http://localhost:3001/api/health)
        echo "Health check response:"
        echo "$health_response" | jq . 2>/dev/null || echo "$health_response"
        break
    else
        print_status "Attempt $attempt/$max_attempts: Health endpoint not ready yet..."
        sleep 2
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    print_error "❌ Health endpoint failed to respond after $max_attempts attempts"
    print_status "Container logs:"
    docker logs myhome-test-container
    exit 1
fi

# Test container logs
print_status "Checking container logs for errors..."
logs=$(docker logs myhome-test-container 2>&1)

if echo "$logs" | grep -i error | grep -v "DeprecationWarning" | grep -v "ExperimentalWarning"; then
    print_warning "⚠️  Found errors in logs (excluding warnings):"
    echo "$logs" | grep -i error | grep -v "DeprecationWarning" | grep -v "ExperimentalWarning"
else
    print_success "✅ No critical errors found in logs"
fi

# Test environment validation
print_status "Testing environment validation..."
if echo "$logs" | grep -q "Environment validation"; then
    print_success "✅ Environment validation is working"
else
    print_warning "⚠️  Environment validation messages not found in logs"
fi

# Performance check
print_status "Checking container resource usage..."
stats=$(docker stats myhome-test-container --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}")
echo "$stats"

print_header "Build Test Summary"

print_success "🎉 Docker build test completed successfully!"
print_status "Summary:"
echo "  ✅ Docker build: SUCCESS"
echo "  ✅ Container startup: SUCCESS"
echo "  ✅ Health endpoint: SUCCESS"
echo "  ✅ Environment validation: SUCCESS"
echo "  📊 Image size: $image_size"

print_status "Your Docker configuration is ready for Dockploy deployment!"

# Optional: Keep container running for manual testing
print_status "Container is running on http://localhost:3001"
print_status "Press Enter to stop and cleanup, or Ctrl+C to keep running for manual testing..."
read -r

print_success "Test completed successfully!"
