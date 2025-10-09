#!/usr/bin/env bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="myhome-dockploy-test"
IMAGE_TAG="latest"
CONTAINER_NAME="myhome-dockploy-test-container"
TEST_PORT="3001"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🐳 MyHome Dockploy Build Test${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Step 1: Clean up previous test containers
echo -e "${YELLOW}🧹 Cleaning up previous test containers...${NC}"
docker rm -f ${CONTAINER_NAME} 2>/dev/null || true
docker rmi ${IMAGE_NAME}:${IMAGE_TAG} 2>/dev/null || true
echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

# Step 2: Build Docker image
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}📦 Building Docker image...${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

docker build \
  --progress=plain \
  -t ${IMAGE_NAME}:${IMAGE_TAG} \
  .

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Build successful!${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

# Step 3: Show image info
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}📊 Image Information${NC}"
echo -e "${BLUE}============================================${NC}"
docker images ${IMAGE_NAME}:${IMAGE_TAG}
echo ""

# Step 4: Ask if user wants to run the container
echo -e "${YELLOW}Do you want to run the container for testing? (y/n)${NC}"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}🚀 Starting test container...${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        echo -e "${RED}❌ .env.production not found!${NC}"
        echo -e "${YELLOW}Please create .env.production with required environment variables.${NC}"
        exit 1
    fi
    
    # Run container
    docker run -d \
      --name ${CONTAINER_NAME} \
      -p ${TEST_PORT}:3000 \
      --env-file .env.production \
      ${IMAGE_NAME}:${IMAGE_TAG}
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Container started successfully!${NC}"
        echo ""
        echo -e "${BLUE}============================================${NC}"
        echo -e "${BLUE}📋 Container Information${NC}"
        echo -e "${BLUE}============================================${NC}"
        echo -e "Container Name: ${CONTAINER_NAME}"
        echo -e "Port: http://localhost:${TEST_PORT}"
        echo ""
        
        # Wait a bit for container to initialize
        echo -e "${YELLOW}⏳ Waiting for container to initialize (15 seconds)...${NC}"
        sleep 15
        
        # Show logs
        echo ""
        echo -e "${BLUE}============================================${NC}"
        echo -e "${BLUE}📜 Container Logs${NC}"
        echo -e "${BLUE}============================================${NC}"
        docker logs --tail 100 ${CONTAINER_NAME}
        
        echo ""
        echo -e "${BLUE}============================================${NC}"
        echo -e "${BLUE}🔍 Useful Commands${NC}"
        echo -e "${BLUE}============================================${NC}"
        echo -e "View logs:        ${GREEN}docker logs -f ${CONTAINER_NAME}${NC}"
        echo -e "Stop container:   ${GREEN}docker stop ${CONTAINER_NAME}${NC}"
        echo -e "Remove container: ${GREEN}docker rm -f ${CONTAINER_NAME}${NC}"
        echo -e "Access shell:     ${GREEN}docker exec -it ${CONTAINER_NAME} sh${NC}"
        echo -e "Test endpoint:    ${GREEN}curl http://localhost:${TEST_PORT}${NC}"
        echo ""
        
        # Check if container is still running
        sleep 2
        if docker ps | grep -q ${CONTAINER_NAME}; then
            echo -e "${GREEN}✅ Container is running!${NC}"
            echo -e "${GREEN}🌐 Access the app at: http://localhost:${TEST_PORT}${NC}"
            echo ""
            echo -e "${YELLOW}Press Enter to stop and cleanup, or Ctrl+C to keep running...${NC}"
            read -r
            
            # Cleanup
            echo ""
            echo -e "${YELLOW}🧹 Stopping and removing container...${NC}"
            docker stop ${CONTAINER_NAME}
            docker rm ${CONTAINER_NAME}
            echo -e "${GREEN}✅ Cleanup complete${NC}"
        else
            echo -e "${RED}❌ Container stopped unexpectedly!${NC}"
            echo -e "${YELLOW}Check logs above for errors.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Failed to start container!${NC}"
        exit 1
    fi
else
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}📝 Manual Run Instructions${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
    echo -e "To run the container manually:"
    echo -e "${GREEN}docker run -d \\${NC}"
    echo -e "${GREEN}  --name ${CONTAINER_NAME} \\${NC}"
    echo -e "${GREEN}  -p ${TEST_PORT}:3000 \\${NC}"
    echo -e "${GREEN}  --env-file .env.production \\${NC}"
    echo -e "${GREEN}  ${IMAGE_NAME}:${IMAGE_TAG}${NC}"
    echo ""
    echo -e "Then view logs:"
    echo -e "${GREEN}docker logs -f ${CONTAINER_NAME}${NC}"
    echo ""
fi

echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}✅ Test complete!${NC}"
echo -e "${BLUE}============================================${NC}"

