#!/bin/bash

# Test Payment Status Endpoint
# Usage: ./scripts/test-payment-status.sh [orderId]

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

echo -e "${BLUE}🧪 Testing Payment Status Endpoint${NC}"
echo -e "${BLUE}====================================${NC}"
echo -e "Base URL: ${GREEN}$BASE_URL${NC}"
echo ""

# Check if orderId is provided
if [ -z "$1" ]; then
  echo -e "${YELLOW}⚠️  No order ID provided${NC}"
  echo -e "Usage: $0 <orderId>"
  echo ""
  echo -e "Example: $0 FULL-CMGFZP00-MGFZP00U"
  echo ""
  exit 1
fi

ORDER_ID=$1

echo -e "${BLUE}Testing with Order ID: ${GREEN}$ORDER_ID${NC}"
echo ""

# Test 1: GET /api/payments/status
echo -e "${BLUE}Test 1: GET /api/payments/status?orderId=$ORDER_ID${NC}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/payments/status?orderId=$ORDER_ID")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "HTTP Status: ${GREEN}$HTTP_CODE${NC}"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ SUCCESS${NC}"
  echo ""
  echo -e "${BLUE}Response:${NC}"
  echo "$BODY" | jq '.'
  echo ""
  
  # Extract payment status
  PAYMENT_STATUS=$(echo "$BODY" | jq -r '.data.payment.status')
  BOOKING_STATUS=$(echo "$BODY" | jq -r '.data.booking.status')
  PAYMENT_METHOD=$(echo "$BODY" | jq -r '.data.payment.paymentMethod')
  TRANSACTION_ID=$(echo "$BODY" | jq -r '.data.payment.transactionId')
  
  echo -e "${BLUE}Summary:${NC}"
  echo -e "  Payment Status: ${GREEN}$PAYMENT_STATUS${NC}"
  echo -e "  Booking Status: ${GREEN}$BOOKING_STATUS${NC}"
  echo -e "  Payment Method: ${GREEN}$PAYMENT_METHOD${NC}"
  echo -e "  Transaction ID: ${GREEN}$TRANSACTION_ID${NC}"
  
elif [ "$HTTP_CODE" = "404" ]; then
  echo -e "${RED}❌ NOT FOUND${NC}"
  echo ""
  echo -e "${BLUE}Response:${NC}"
  echo "$BODY" | jq '.'
  echo ""
  echo -e "${YELLOW}Payment with order ID '$ORDER_ID' not found in database${NC}"
  
elif [ "$HTTP_CODE" = "400" ]; then
  echo -e "${RED}❌ BAD REQUEST${NC}"
  echo ""
  echo -e "${BLUE}Response:${NC}"
  echo "$BODY" | jq '.'
  
else
  echo -e "${RED}❌ ERROR${NC}"
  echo ""
  echo -e "${BLUE}Response:${NC}"
  echo "$BODY" | jq '.'
fi

echo ""
echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}Test Complete${NC}"

