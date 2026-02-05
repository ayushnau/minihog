# MiniHog SDK Architecture

## Overview

The MiniHog SDK uses an environment-based configuration approach instead of requiring users to specify API endpoints directly. This simplifies integration and ensures users always connect to the correct endpoint. The SDK automatically handles event batching, retry logic, and session management.

## Architecture Flow

```
User Code
    ↓
MiniHog.init({ environment: 'production' })
    ↓
SDK Internal Mapping
    ↓
ENDPOINT_MAP[environment] → 'https://backendapiserver.vercel.app'
    ↓
Transport Layer
    ↓
API Endpoint
```

## Environment Mapping

The SDK maintains an internal mapping of environments to endpoints:

| Environment | Endpoint | Use Case |
|------------|----------|----------|
| `production` | `https://backendapiserver.vercel.app` | Production applications |
| `sandbox` | `https://backendapiserver.vercel.app` | Testing/staging (currently same as production) |
| `development` | `http://localhost:3000` | Local development |

## Implementation Details

### 1. Configuration Interface

```typescript
export interface MiniHogConfig {
  environment?: 'production' | 'sandbox' | 'development'; // Default: 'production'
  apiKey?: string; // Required for event tracking - get from dashboard
  batchSize?: number; // Default: 10
  flushInterval?: number; // Default: 5000ms
  enableRetry?: boolean; // Default: true
  maxRetries?: number; // Default: 3
}
```

**Note:** `apiKey` is required for event tracking. Get your API key from the [MiniHog Dashboard](https://minihog.ayushnautiyal.com).

### 2. Endpoint Resolution

When `init()` is called:
1. SDK checks if `environment` is provided (defaults to `'production'`)
2. Looks up the endpoint in `ENDPOINT_MAP`
3. Sets the internal `endpoint` property
4. Initializes the Transport layer with the resolved endpoint and API key
5. Sets up the Queue with the specified batch size
6. Starts the automatic flush timer

### 3. API Key Authentication

The SDK includes the API key in the `X-API-Key` header for all requests:
- API key is passed to the Transport layer during initialization
- Transport includes `X-API-Key` header in all event tracking requests
- Backend validates the API key and associates events with the user

### 4. Event Flow

```
User calls MiniHog.track()
    ↓
Queue.add(event)
    ↓
Queue checks if batch is full
    ↓
If full → flushEvents()
    ↓
Transport.send(events)
    ↓
POST /track with X-API-Key header
    ↓
Backend validates API key
    ↓
Event stored with apiKeyId
```

### 5. Benefits

- **Simplified Integration**: Users don't need to know or manage endpoint URLs
- **Environment Safety**: Prevents accidental connections to wrong environments
- **Easy Updates**: Endpoint URLs can be updated in one place (SDK code)
- **Type Safety**: TypeScript ensures only valid environments are used

## Usage Examples

### Production
```javascript
MiniHog.init({
  environment: 'production',
  apiKey: 'your-api-key'
});
```

### Sandbox/Testing
```javascript
MiniHog.init({
  environment: 'sandbox',
  apiKey: 'your-test-api-key'
});
```

### Local Development
```javascript
MiniHog.init({
  environment: 'development',
  apiKey: 'your-dev-api-key'
});
```

## Future Enhancements

1. **Custom Endpoints**: Could add support for custom endpoints while keeping environment as default
2. **Environment Detection**: Auto-detect environment from `NODE_ENV` or similar
3. **Multiple Sandbox Environments**: Support for multiple sandbox endpoints (sandbox1, sandbox2, etc.)
4. **Endpoint Validation**: Validate endpoint health on initialization

## Migration from Endpoint-Based

If you were using the old endpoint-based approach:

**Before:**
```javascript
MiniHog.init({
  endpoint: 'https://backendapiserver.vercel.app',
  apiKey: 'your-api-key'
});
```

**After:**
```javascript
MiniHog.init({
  environment: 'production',
  apiKey: 'your-api-key'
});
```

The SDK automatically resolves the endpoint based on the environment.

## Internal Components

### Queue (`queue.ts`)
- Batches events before sending
- Configurable batch size (default: 10)
- Calls flush callback when batch is full

### Transport (`transport.ts`)
- Handles HTTP requests to the API
- Includes `X-API-Key` header for authentication
- Implements retry logic with exponential backoff
- Handles network errors gracefully

### Session (`session.ts`)
- Manages distinct ID (user/device identifier)
- Persists across page reloads using localStorage
- Generates unique IDs if not present

### Retry (`retry.ts`)
- Exponential backoff strategy
- Configurable max retries
- Handles transient network failures

## Related Documentation

- [SDK README](../README.md) - Usage guide and API reference
- [Main Documentation](../../../../README.md) - Project overview
- [Dashboard](https://minihog.ayushnautiyal.com) - Get API keys
