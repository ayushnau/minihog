#!/bin/bash

# Test script to simulate multiple unique visitors
# Make sure your API is running and you have an API key

API_URL="${API_URL:-http://localhost:3000}"
API_KEY="${API_KEY:-your-api-key-here}"

echo "🧪 Testing Multiple Unique Visitors"
echo "===================================="
echo ""

# Generate unique distinct IDs
USER1="test_user_$(date +%s)_1"
USER2="test_user_$(date +%s)_2"
USER3="test_user_$(date +%s)_3"

echo "User 1: $USER1"
echo "User 2: $USER2"
echo "User 3: $USER3"
echo ""

# Track events for User 1
echo "📊 Tracking events for User 1..."
curl -X POST "$API_URL/track" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"event\": \"button_click\",
    \"distinct_id\": \"$USER1\",
    \"properties\": {
      \"page\": \"home\",
      \"button_name\": \"signup\"
    }
  }" -s > /dev/null

curl -X POST "$API_URL/track" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"event\": \"page_view\",
    \"distinct_id\": \"$USER1\",
    \"properties\": {
      \"page\": \"home\"
    }
  }" -s > /dev/null

echo "✅ User 1 events tracked"
echo ""

# Track events for User 2
echo "📊 Tracking events for User 2..."
curl -X POST "$API_URL/track" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"event\": \"button_click\",
    \"distinct_id\": \"$USER2\",
    \"properties\": {
      \"page\": \"pricing\",
      \"button_name\": \"signup\"
    }
  }" -s > /dev/null

curl -X POST "$API_URL/track" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"event\": \"purchase\",
    \"distinct_id\": \"$USER2\",
    \"properties\": {
      \"amount\": 299,
      \"currency\": \"USD\"
    }
  }" -s > /dev/null

echo "✅ User 2 events tracked"
echo ""

# Track events for User 3
echo "📊 Tracking events for User 3..."
curl -X POST "$API_URL/track" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"event\": \"button_click\",
    \"distinct_id\": \"$USER3\",
    \"properties\": {
      \"page\": \"home\",
      \"button_name\": \"pricing\"
    }
  }" -s > /dev/null

echo "✅ User 3 events tracked"
echo ""

echo "🎉 All events tracked!"
echo ""
echo "Now check your dashboard - you should see 3 unique end users for 'button_click' event"
echo ""
echo "To check analytics:"
echo "curl -X GET \"$API_URL/dashboard/analytics/events?event=button_click&from=$(date -u -v-7d +%Y-%m-%d 2>/dev/null || date -u -d '7 days ago' +%Y-%m-%d)&to=$(date -u +%Y-%m-%d)\" -H \"Authorization: Bearer YOUR_JWT_TOKEN\""

