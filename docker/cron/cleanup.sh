#!/bin/bash
#
# Cleanup Expired Bookings Cron Script
# 
# Script ini dipanggil oleh cron setiap 5 menit untuk cleanup
# expired bookings dan payments via internal API call
#

set -e

# Timestamp untuk logging
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Validate CRON_SECRET environment variable
if [ -z "$CRON_SECRET" ]; then
    echo "[$TIMESTAMP] ERROR: CRON_SECRET environment variable is not set"
    exit 1
fi

# Internal app service URL (via Docker network)
APP_URL="${APP_URL:-http://app:3000}"
ENDPOINT="${APP_URL}/api/cron/cleanup-expired"

echo "[$TIMESTAMP] Starting cleanup process..."
echo "[$TIMESTAMP] Calling: $ENDPOINT"

# Execute curl with retry logic
# --retry 3: Retry up to 3 times on transient errors
# --retry-delay 2: Wait 2 seconds between retries
# --max-time 20: Maximum 20 seconds for the entire operation
# -f: Fail silently on HTTP errors
# -s: Silent mode (no progress bar)
# -S: Show errors even in silent mode
RESPONSE=$(curl -fsS \
    --retry 3 \
    --retry-delay 2 \
    --max-time 20 \
    -H "Authorization: Bearer $CRON_SECRET" \
    "$ENDPOINT" 2>&1)

CURL_EXIT_CODE=$?

if [ $CURL_EXIT_CODE -eq 0 ]; then
    echo "[$TIMESTAMP] SUCCESS: Cleanup completed"
    echo "[$TIMESTAMP] Response: $RESPONSE"
    exit 0
else
    echo "[$TIMESTAMP] ERROR: Cleanup failed with exit code $CURL_EXIT_CODE"
    echo "[$TIMESTAMP] Response: $RESPONSE"
    exit 1
fi

