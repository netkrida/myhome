#!/bin/bash
#
# Test Script untuk Cron Cleanup API
# 
# Usage:
#   ./test-cron-api.sh [BASE_URL] [CRON_SECRET]
#
# Examples:
#   ./test-cron-api.sh http://localhost:3000 "your-secret"
#   ./test-cron-api.sh https://myhome.co.id "your-secret"
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
BASE_URL="${1:-http://localhost:3000}"
CRON_SECRET="${2}"

echo "=========================================="
echo "🧪 Cron Cleanup API Test"
echo "=========================================="
echo ""

# Check if CRON_SECRET is provided
if [ -z "$CRON_SECRET" ]; then
    echo -e "${RED}❌ ERROR: CRON_SECRET not provided${NC}"
    echo ""
    echo "Usage: $0 [BASE_URL] [CRON_SECRET]"
    echo ""
    echo "Examples:"
    echo "  $0 http://localhost:3000 \"your-secret\""
    echo "  $0 https://myhome.co.id \"your-secret\""
    echo ""
    exit 1
fi

echo "Base URL: $BASE_URL"
echo "CRON_SECRET: ${CRON_SECRET:0:10}..." # Show only first 10 chars
echo ""

# Test 1: Health Check
echo "=========================================="
echo "Test 1: Health Check"
echo "=========================================="
echo "GET $BASE_URL/api/health"
echo ""

HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/api/health")
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo "Status: $HEALTH_STATUS"
echo "Response:"
echo "$HEALTH_BODY" | jq '.' 2>/dev/null || echo "$HEALTH_BODY"
echo ""

if [ "$HEALTH_STATUS" -eq 200 ] || [ "$HEALTH_STATUS" -eq 206 ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
fi
echo ""

# Test 2: Cleanup without auth (should fail with 401)
echo "=========================================="
echo "Test 2: Cleanup without Authorization"
echo "=========================================="
echo "GET $BASE_URL/api/cron/cleanup-expired"
echo "Expected: 401 Unauthorized"
echo ""

NOAUTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/api/cron/cleanup-expired")
NOAUTH_BODY=$(echo "$NOAUTH_RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
NOAUTH_STATUS=$(echo "$NOAUTH_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo "Status: $NOAUTH_STATUS"
echo "Response:"
echo "$NOAUTH_BODY" | jq '.' 2>/dev/null || echo "$NOAUTH_BODY"
echo ""

if [ "$NOAUTH_STATUS" -eq 401 ]; then
    echo -e "${GREEN}✅ Correctly rejected (401)${NC}"
else
    echo -e "${RED}❌ Expected 401, got $NOAUTH_STATUS${NC}"
fi
echo ""

# Test 3: Cleanup with wrong token (should fail with 401)
echo "=========================================="
echo "Test 3: Cleanup with Wrong Token"
echo "=========================================="
echo "GET $BASE_URL/api/cron/cleanup-expired"
echo "Authorization: Bearer wrong-token"
echo "Expected: 401 Unauthorized"
echo ""

WRONGAUTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Authorization: Bearer wrong-token" \
    "$BASE_URL/api/cron/cleanup-expired")
WRONGAUTH_BODY=$(echo "$WRONGAUTH_RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
WRONGAUTH_STATUS=$(echo "$WRONGAUTH_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo "Status: $WRONGAUTH_STATUS"
echo "Response:"
echo "$WRONGAUTH_BODY" | jq '.' 2>/dev/null || echo "$WRONGAUTH_BODY"
echo ""

if [ "$WRONGAUTH_STATUS" -eq 401 ]; then
    echo -e "${GREEN}✅ Correctly rejected (401)${NC}"
else
    echo -e "${RED}❌ Expected 401, got $WRONGAUTH_STATUS${NC}"
fi
echo ""

# Test 4: Cleanup with correct token (should succeed)
echo "=========================================="
echo "Test 4: Cleanup with Correct Token"
echo "=========================================="
echo "GET $BASE_URL/api/cron/cleanup-expired"
echo "Authorization: Bearer <CRON_SECRET>"
echo "Expected: 200 OK"
echo ""

CLEANUP_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Authorization: Bearer $CRON_SECRET" \
    "$BASE_URL/api/cron/cleanup-expired")
CLEANUP_BODY=$(echo "$CLEANUP_RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
CLEANUP_STATUS=$(echo "$CLEANUP_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo "Status: $CLEANUP_STATUS"
echo "Response:"
echo "$CLEANUP_BODY" | jq '.' 2>/dev/null || echo "$CLEANUP_BODY"
echo ""

if [ "$CLEANUP_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Cleanup executed successfully${NC}"
    
    # Parse and display metrics
    if command -v jq &> /dev/null; then
        echo ""
        echo "📊 Cleanup Metrics:"
        echo "  Executed At: $(echo "$CLEANUP_BODY" | jq -r '.data.executedAt')"
        echo "  Grace Minutes: $(echo "$CLEANUP_BODY" | jq -r '.data.graceMinutes')"
        echo "  Expired Payments: $(echo "$CLEANUP_BODY" | jq -r '.data.expiredPaymentsCount')"
        echo "  Deleted Bookings: $(echo "$CLEANUP_BODY" | jq -r '.data.deletedBookingsCount')"
        
        DELETED_IDS=$(echo "$CLEANUP_BODY" | jq -r '.data.deletedBookingIds[]' 2>/dev/null)
        if [ -n "$DELETED_IDS" ]; then
            echo "  Deleted Booking IDs:"
            echo "$DELETED_IDS" | while read -r id; do
                echo "    - $id"
            done
        fi
    fi
else
    echo -e "${RED}❌ Cleanup failed with status $CLEANUP_STATUS${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "📋 Test Summary"
echo "=========================================="
echo ""

TOTAL_TESTS=4
PASSED_TESTS=0

[ "$HEALTH_STATUS" -eq 200 ] || [ "$HEALTH_STATUS" -eq 206 ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$NOAUTH_STATUS" -eq 401 ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$WRONGAUTH_STATUS" -eq 401 ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$CLEANUP_STATUS" -eq 200 ] && PASSED_TESTS=$((PASSED_TESTS + 1))

echo "Passed: $PASSED_TESTS / $TOTAL_TESTS"
echo ""

if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    exit 1
fi

