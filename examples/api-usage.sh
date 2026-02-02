#!/bin/bash

# Example API usage with curl
# Make sure the API server is running on http://localhost:3000

API_URL="http://localhost:3000"

echo "🚀 MiniHog API Usage Examples\n"

# Health check
echo "1. Health check:"
curl -X GET "$API_URL/health"
echo "\n"

# Track an event
echo "2. Track an event:"
curl -X POST "$API_URL/track" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "app_open",
    "distinct_id": "user_123",
    "properties": {
      "platform": "web",
      "version": "1.0.0"
    }
  }'
echo "\n"

# Record a click (for attribution)
echo "3. Record a click:"
curl -X POST "$API_URL/click" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "device_abc",
    "campaign_id": "INSTAGRAM_12",
    "timestamp": '$(date +%s)000'
  }'
echo "\n"

# Record an install (triggers attribution)
echo "4. Record an install:"
curl -X POST "$API_URL/install" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "device_abc",
    "timestamp": '$(date +%s)000'
  }'
echo "\n"

# Get event counts
echo "5. Get event counts:"
curl -X GET "$API_URL/analytics/events?event=app_open&from=2026-01-01&to=2026-12-31"
echo "\n"

# Get funnel analysis
echo "6. Get funnel analysis:"
curl -X GET "$API_URL/analytics/funnel?steps=install,signup,purchase&from=2026-01-01&to=2026-12-31"
echo "\n"

# Get retention analysis
echo "7. Get retention analysis:"
curl -X GET "$API_URL/analytics/retention?cohort=install&day=7&from=2026-01-01&to=2026-12-31"
echo "\n"

# Get attribution analytics
echo "8. Get attribution analytics:"
curl -X GET "$API_URL/analytics/attribution"
echo "\n"

echo "✅ All examples completed!"


