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
  endpoint: 'https://backendapiserver.vercel.app', // Your MiniHog API endpoint
  apiKey: 'your-api-key', // Optional
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

## Configuration

```typescript
interface MiniHogConfig {
  endpoint: string;        // Required: Your MiniHog API endpoint
  apiKey?: string;         // Optional: API key for authentication
  batchSize?: number;      // Optional: Events to batch before sending (default: 10)
  flushInterval?: number;  // Optional: Auto-flush interval in ms (default: 5000)
  enableRetry?: boolean;   // Optional: Enable retry logic (default: true)
  maxRetries?: number;     // Optional: Maximum retries (default: 3)
}
```

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
  endpoint: 'https://api.example.com',
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

## Links

- 📦 [npm Package](https://www.npmjs.com/package/minihog-sdk)
- 📚 [Documentation](https://github.com/yourusername/posthog)
- 🐛 [Report Issues](https://github.com/yourusername/posthog/issues)
