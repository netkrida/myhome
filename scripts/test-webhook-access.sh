#!/bin/bash

# Test Webhook Access Script
# This script tests if webhook endpoints are accessible without authentication

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

echo -e "${BLUE}🧪 Testing Webhook Access${NC}"
echo -e "${BLUE}=========================${NC}"
echo -e "Base URL: ${GREEN}$BASE_URL${NC}"
echo ""

# Test 1: GET /api/midtrans/notify (health check)
echo -e "${BLUE}Test 1: GET /api/midtrans/notify${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/midtrans/notify")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ PASS - Status: $HTTP_CODE${NC}"
  echo -e "   Response: $BODY"
else
  echo -e "${RED}❌ FAIL - Status: $HTTP_CODE${NC}"
  echo -e "   Response: $BODY"
  echo -e "${YELLOW}   Expected: 200 (should not redirect to login)${NC}"
fi
echo ""

# Test 2: GET /api/bookings/payment/webhook (health check)
echo -e "${BLUE}Test 2: GET /api/bookings/payment/webhook${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/bookings/payment/webhook")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ PASS - Status: $HTTP_CODE${NC}"
  echo -e "   Response: $BODY"
else
  echo -e "${RED}❌ FAIL - Status: $HTTP_CODE${NC}"
  echo -e "   Response: $BODY"
  echo -e "${YELLOW}   Expected: 200 (should not redirect to login)${NC}"
fi
echo ""

# Test 3: POST /api/midtrans/notify (with invalid payload)
echo -e "${BLUE}Test 3: POST /api/midtrans/notify (invalid payload)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/midtrans/notify" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ PASS - Status: $HTTP_CODE${NC}"
  echo -e "   Response: $BODY"
  echo -e "${YELLOW}   Note: Should return 400 (validation error) or 200 (handled gracefully)${NC}"
else
  echo -e "${RED}❌ FAIL - Status: $HTTP_CODE${NC}"
  echo -e "   Response: $BODY"
  echo -e "${YELLOW}   Expected: 400 or 200 (NOT 307 redirect to login)${NC}"
fi
echo ""

# Test 4: GET /api/payments/status (should be public)
echo -e "${BLUE}Test 4: GET /api/payments/status?orderId=TEST${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/payments/status?orderId=TEST")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
  echo -e "${GREEN}✅ PASS - Status: $HTTP_CODE${NC}"
  echo -e "   Response: $BODY"
else
  echo -e "${RED}❌ FAIL - Status: $HTTP_CODE${NC}"
  echo -e "   Response: $BODY"
  echo -e "${YELLOW}   Expected: 200 or 404 (should not redirect to login)${NC}"
fi
echo ""

# Test 5: GET /payment/success (should be public)
echo -e "${BLUE}Test 5: GET /payment/success${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/payment/success")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ PASS - Status: $HTTP_CODE${NC}"
  echo -e "   Page accessible without auth"
else
  echo -e "${RED}❌ FAIL - Status: $HTTP_CODE${NC}"
  echo -e "${YELLOW}   Expected: 200 (should not redirect to login)${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}=========================${NC}"
echo -e "${BLUE}Summary:${NC}"
echo -e "If all tests PASS, webhook endpoints are accessible without authentication."
echo -e "If any test FAILS with 307 redirect, middleware is blocking the endpoint."
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. If tests PASS: Update Midtrans Dashboard notification URL"
echo -e "2. If tests FAIL: Check middleware.ts and restart server"
echo -e "3. Test real payment flow"

