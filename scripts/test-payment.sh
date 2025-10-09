#!/bin/bash

# Test Payment Script
# Usage: ./scripts/test-payment.sh [orderId]

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get base URL from .env.local
BASE_URL=$(grep APP_BASE_URL .env.local | cut -d '=' -f2 | tr -d '"' | tr -d ' ')

if [ -z "$BASE_URL" ]; then
  echo -e "${RED}❌ APP_BASE_URL not found in .env.local${NC}"
  exit 1
fi

# Remove trailing slash
BASE_URL=${BASE_URL%/}

echo -e "${BLUE}🧪 Payment Testing Script${NC}"
echo -e "${BLUE}=========================${NC}"
echo -e "Base URL: ${GREEN}$BASE_URL${NC}"
echo ""

# Check if orderId is provided
if [ -z "$1" ]; then
  echo -e "${YELLOW}⚠️  No order ID provided${NC}"
  echo -e "Usage: $0 <orderId>"
  echo ""
  echo -e "Example: $0 DEP-CLXXX-ABC123"
  echo ""
  echo -e "${BLUE}Available commands:${NC}"
  echo -e "  1. Check payment status:    $0 check <orderId>"
  echo -e "  2. Test webhook:            $0 webhook <orderId>"
  echo -e "  3. Open success page:       $0 success <orderId>"
  echo ""
  exit 1
fi

COMMAND=$1
ORDER_ID=$2

# If only one argument, assume it's orderId for check
if [ -z "$ORDER_ID" ]; then
  ORDER_ID=$COMMAND
  COMMAND="check"
fi

case $COMMAND in
  check)
    echo -e "${BLUE}🔍 Checking payment status...${NC}"
    echo -e "Order ID: ${GREEN}$ORDER_ID${NC}"
    echo ""
    
    RESPONSE=$(curl -s "$BASE_URL/api/debug/payment/$ORDER_ID")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
      echo -e "${GREEN}✅ Payment found!${NC}"
      echo ""
      echo "$RESPONSE" | jq '.'
    else
      echo -e "${RED}❌ Payment not found or error${NC}"
      echo ""
      echo "$RESPONSE" | jq '.'
    fi
    ;;
    
  webhook)
    echo -e "${BLUE}🔔 Testing webhook...${NC}"
    echo -e "Order ID: ${GREEN}$ORDER_ID${NC}"
    echo ""
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/debug/test-webhook" \
      -H "Content-Type: application/json" \
      -d "{\"orderId\":\"$ORDER_ID\",\"transactionStatus\":\"settlement\"}")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
      echo -e "${GREEN}✅ Webhook test successful!${NC}"
      echo ""
      echo "$RESPONSE" | jq '.'
      echo ""
      echo -e "${BLUE}💡 Now check the database to verify updates${NC}"
    else
      echo -e "${RED}❌ Webhook test failed${NC}"
      echo ""
      echo "$RESPONSE" | jq '.'
    fi
    ;;
    
  success)
    echo -e "${BLUE}🌐 Opening success page...${NC}"
    echo -e "Order ID: ${GREEN}$ORDER_ID${NC}"
    echo ""
    
    URL="$BASE_URL/payment/success?orderId=$ORDER_ID"
    echo -e "URL: ${GREEN}$URL${NC}"
    echo ""
    
    # Try to open in browser (works on macOS, Linux with xdg-open, Windows with start)
    if command -v open &> /dev/null; then
      open "$URL"
    elif command -v xdg-open &> /dev/null; then
      xdg-open "$URL"
    elif command -v start &> /dev/null; then
      start "$URL"
    else
      echo -e "${YELLOW}⚠️  Could not open browser automatically${NC}"
      echo -e "Please open this URL manually: $URL"
    fi
    ;;
    
  *)
    echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
    echo ""
    echo -e "${BLUE}Available commands:${NC}"
    echo -e "  check    - Check payment status"
    echo -e "  webhook  - Test webhook processing"
    echo -e "  success  - Open success page"
    ;;
esac

