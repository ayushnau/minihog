# User-Based Event Filtering Implementation

## Overview
This document describes the implementation of user-based event filtering, ensuring that each dashboard user only sees events tracked with their own API keys.

## Changes Made

### 1. Database Schema (`packages/api/prisma/schema.prisma`)
- Added `apiKeyId` field to `Event` model (nullable, for backward compatibility)
- Added relation between `Event` and `ApiKey`
- Added index on `apiKeyId` for query performance
- Added `events` relation to `ApiKey` model

### 2. API Key Authentication (`packages/api/src/middleware/apiKeyAuth.ts`)
- Created middleware to validate API keys from:
  - `X-API-Key` header
  - `Authorization: Bearer <key>` header
  - `api_key` query parameter
- Updates `lastUsed` timestamp when API key is used
- Attaches `apiKeyId` to request object

### 3. Track Endpoint (`packages/api/src/routes/track.ts`)
- Updated to require API key authentication
- Stores `apiKeyId` with each event
- Events are now associated with the API key used to track them

### 4. Analytics Services
Updated all analytics services to accept optional `apiKeyIds` parameter:
- `getEventCounts()` - filters events by API keys
- `getFunnelAnalysis()` - filters funnel steps by API keys
- `getRetentionAnalysis()` - filters retention data by API keys

### 5. Dashboard Analytics Endpoints (`packages/api/src/routes/dashboardAnalytics.ts`)
- Created new `/dashboard/analytics/*` endpoints
- Uses JWT authentication (from dashboard session)
- Automatically filters by logged-in user's API keys
- Endpoints:
  - `GET /dashboard/analytics/events`
  - `GET /dashboard/analytics/funnel`
  - `GET /dashboard/analytics/retention`
  - `GET /dashboard/analytics/attribution`

### 6. JWT Authentication Middleware (`packages/api/src/middleware/jwtAuth.ts`)
- Validates JWT tokens from dashboard
- Extracts user ID and fetches user's API keys
- Attaches `apiKeyIds` array to request object

### 7. SDK Updates (`packages/sdk/src/transport.ts`, `packages/sdk/src/index.ts`)
- Transport now accepts and sends API key in `X-API-Key` header
- SDK automatically includes API key in all track requests

### 8. Dashboard API Client (`packages/dashboard/src/lib/api.ts`)
- Updated to use `/dashboard/analytics/*` endpoints
- Configured to send cookies (JWT token) with requests
- All analytics calls now automatically filtered by user's API keys

### 9. Dependencies
- Added `cookie-parser` to API package
- Added `jose` to API package for JWT verification
- Added `@types/cookie-parser` to dev dependencies

## Next Steps

### 1. Install Dependencies
```bash
cd packages/api
npm install
```

### 2. Run Database Migration
```bash
cd packages/api
npx prisma migrate dev --name add_api_key_to_events
```

This will:
- Add `api_key_id` column to `events` table
- Create foreign key relationship
- Add index for performance

### 3. Update Existing Events (Optional)
If you have existing events without `apiKeyId`, they will remain accessible to all users (or you can run a migration to assign them to a default API key).

### 4. Test the Implementation

#### Test SDK Tracking:
```javascript
import MiniHog from 'minihog-sdk';

MiniHog.init({
  environment: 'production',
  apiKey: 'your-api-key-here', // Required now!
});

MiniHog.track('test_event', { test: true });
```

#### Test Dashboard:
1. Log in to dashboard
2. Generate an API key
3. Use that API key in SDK to track events
4. View dashboard - should only show events tracked with your API keys

## Architecture Flow

### Event Tracking Flow:
```
SDK → POST /track (with X-API-Key header)
  → API Key Validation Middleware
  → Store Event with apiKeyId
  → Event stored in database
```

### Dashboard Analytics Flow:
```
Dashboard → GET /dashboard/analytics/events (with JWT cookie)
  → JWT Authentication Middleware
  → Get User's API Keys
  → Filter Events by apiKeyIds
  → Return filtered results
```

## Security Notes

1. **API Key Required**: All `/track` requests now require a valid API key
2. **JWT Required**: All `/dashboard/analytics/*` requests require valid JWT token
3. **Data Isolation**: Users can only see events tracked with their own API keys
4. **Backward Compatibility**: Existing events without `apiKeyId` are still accessible (consider migration)

## Breaking Changes

1. **SDK**: API key is now **required** (not optional) for tracking events
2. **Track Endpoint**: Returns 401 if API key is missing or invalid
3. **Dashboard**: Uses new endpoints (`/dashboard/analytics/*` instead of `/analytics/*`)

## Migration Strategy

If you have existing events:
1. Events created before this change won't have `apiKeyId`
2. These events will be visible to all users in analytics
3. To fix: Create a migration script to assign old events to a default API key or delete them

## Testing Checklist

- [ ] Install dependencies
- [ ] Run database migration
- [ ] Test SDK tracking with API key
- [ ] Test dashboard login and API key generation
- [ ] Test dashboard analytics (should only show user's events)
- [ ] Test with multiple users (data isolation)
- [ ] Test error handling (invalid API key, expired JWT)

