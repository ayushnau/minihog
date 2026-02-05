# MiniHog SDK

JavaScript SDK for MiniHog analytics - track events, funnels, retention, and attribution.

[![npm version](https://img.shields.io/npm/v/minihog-sdk.svg)](https://www.npmjs.com/package/minihog-sdk)
[![npm downloads](https://img.shields.io/npm/dm/minihog-sdk.svg)](https://www.npmjs.com/package/minihog-sdk)

📦 **npm**: [minihog-sdk](https://www.npmjs.com/package/minihog-sdk)

## Installation

```bash
npm install minihog-sdk
```

## Quick Start

```javascript
import MiniHog from 'minihog-sdk';

// Initialize the SDK
MiniHog.init({
  environment: 'production', // 'production' | 'sandbox' | 'development'
  apiKey: 'your-api-key', // Required for event tracking
  batchSize: 10, // Optional, default: 10
  flushInterval: 5000, // Optional, default: 5000ms
});

// Track events
MiniHog.track('app_open');
MiniHog.track('purchase', { amount: 299, currency: 'USD' });
MiniHog.track('signup', { plan: 'premium' });

// Manually flush events (optional)
MiniHog.flush();
```

> **Note:** To get an API key, sign up at the [MiniHog Dashboard](https://minihog.ayushnautiyal.com) and generate one in the Keys page.

## Configuration

```typescript
interface MiniHogConfig {
  environment?: 'production' | 'sandbox' | 'development'; // Optional: Environment (default: 'production')
  apiKey?: string;         // Optional: API key for authentication
  batchSize?: number;      // Optional: Events to batch before sending (default: 10)
  flushInterval?: number;  // Optional: Auto-flush interval in ms (default: 5000)
  enableRetry?: boolean;   // Optional: Enable retry logic (default: true)
  maxRetries?: number;     // Optional: Maximum retries (default: 3)
}
```

### Environments

The SDK supports three environments:

- **`production`** (default): Uses the production API endpoint
- **`sandbox`**: Uses the sandbox API endpoint (for testing)
- **`development`**: Uses `http://localhost:3000` (for local development)

The endpoint is automatically determined based on the environment you specify. You don't need to provide the endpoint URL manually.

## Features

- ✅ **Event Batching**: Automatically batches events for efficient sending
- ✅ **Auto-Flush**: Flushes events on page unload and at intervals
- ✅ **Retry Logic**: Automatic retry with exponential backoff
- ✅ **Session Management**: Persistent distinct ID across sessions
- ✅ **TypeScript Support**: Full TypeScript definitions included
- ✅ **Zero Dependencies**: Lightweight with no external dependencies

## API Reference

### `MiniHog.init(config)`

Initialize the SDK with configuration.

```javascript
MiniHog.init({
  environment: 'production', // or 'sandbox' or 'development'
  apiKey: 'your-api-key',
  batchSize: 20,
  flushInterval: 10000,
});
```

### `MiniHog.track(eventName, properties?)`

Track an event with optional properties.

```javascript
MiniHog.track('button_click', {
  button_name: 'signup',
  page: 'homepage',
});
```

### `MiniHog.flush()`

Manually flush all queued events immediately.

```javascript
MiniHog.flush();
```

### `MiniHog.reset()`

Reset the SDK (useful for testing).

```javascript
MiniHog.reset();
```

## Browser Support

Works in all modern browsers that support:
- ES2020 features
- Fetch API (or polyfill)

## License

MIT

## Getting API Keys

1. Visit the [MiniHog Dashboard](https://minihog.ayushnautiyal.com)
2. Sign up or sign in
3. Navigate to the "Keys" page
4. Click "Generate API Key"
5. Copy the generated key and use it in your SDK initialization

## Architecture

For detailed information about the SDK's architecture, including environment-based endpoint resolution, see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests (if available)
npm test
```

### Publishing

See [docs/NPM_PUBLISH.md](./docs/NPM_PUBLISH.md) for publishing instructions.

## Links

- 📦 [npm Package](https://www.npmjs.com/package/minihog-sdk)
- 🌐 [Dashboard](https://minihog.ayushnautiyal.com)
- 📚 [Main Documentation](../../../README.md)
- 🏗️ [Architecture](./docs/ARCHITECTURE.md)
- 💻 [GitHub Repository](https://github.com/ayushnau/minihog)
