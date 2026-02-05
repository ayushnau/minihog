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

// Track page views
MiniHog.track('page_view', { page: '/home' });
MiniHog.track('page_view', { page: '/pricing' });

// Track button clicks with button IDs
MiniHog.track('button_click', { 
  page: '/home',
  button_id: 'signup-btn',
  button_name: 'signup',
  button_text: 'Sign Up Now'
});

// Track other interactive events
MiniHog.track('form_submit', { 
  page: '/contact',
  form_id: 'contact-form',
  form_name: 'Contact Form'
});

MiniHog.track('link_click', { 
  page: '/blog',
  link_id: 'read-more-link',
  link_url: '/blog/article-1'
});

// Track conversions and business events
MiniHog.track('app_open');
MiniHog.track('purchase', { amount: 299, currency: 'USD', page: '/checkout' });
MiniHog.track('signup', { plan: 'premium', page: '/signup' });

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
- ✅ **Flexible Event Tracking**: Track page views, button clicks, form submissions, link clicks, and any custom events
- ✅ **Rich Context**: Include page paths, button IDs, form IDs, and other contextual information with events

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

Track an event with optional properties. You can track page views, button clicks, form submissions, link clicks, and any other user interactions.

**Common Event Types:**

```javascript
// Page views
MiniHog.track('page_view', {
  page: '/home',
  page_title: 'Homepage'
});

// Button clicks with IDs
MiniHog.track('button_click', {
  page: '/home',
  button_id: 'signup-btn',
  button_name: 'signup',
  button_text: 'Sign Up Now'
});

// Form submissions
MiniHog.track('form_submit', {
  page: '/contact',
  form_id: 'contact-form',
  form_name: 'Contact Form'
});

// Link clicks
MiniHog.track('link_click', {
  page: '/blog',
  link_id: 'read-more-link',
  link_url: '/blog/article-1',
  link_text: 'Read More'
});

// Custom events
MiniHog.track('video_play', {
  page: '/tutorials',
  video_id: 'tutorial-1',
  video_title: 'Getting Started'
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

## Event Tracking Best Practices

### 1. Track Page Views
Always include the page path in your events to understand user navigation:

```javascript
// Track page views
MiniHog.track('page_view', { 
  page: window.location.pathname,
  page_title: document.title 
});
```

### 2. Track Button Clicks with IDs
Include button IDs and contextual information for better analytics:

```javascript
// In your button click handlers
document.getElementById('signup-btn').addEventListener('click', () => {
  MiniHog.track('button_click', {
    page: window.location.pathname,
    button_id: 'signup-btn',
    button_name: 'signup',
    button_text: 'Sign Up Now'
  });
});
```

### 3. Track Form Submissions
Capture form interactions with form IDs:

```javascript
document.getElementById('contact-form').addEventListener('submit', (e) => {
  MiniHog.track('form_submit', {
    page: window.location.pathname,
    form_id: 'contact-form',
    form_name: 'Contact Form'
  });
});
```

### 4. Track Link Clicks
Monitor outbound links and navigation:

```javascript
document.querySelectorAll('a[href^="http"]').forEach(link => {
  link.addEventListener('click', () => {
    MiniHog.track('link_click', {
      page: window.location.pathname,
      link_id: link.id || link.className,
      link_url: link.href,
      link_text: link.textContent.trim()
    });
  });
});
```

### 5. Include Context in All Events
Always include the `page` property to understand where events occurred:

```javascript
// Good: Includes page context
MiniHog.track('purchase', { 
  page: '/checkout',
  amount: 299, 
  currency: 'USD' 
});

// Better: Includes more context
MiniHog.track('purchase', { 
  page: '/checkout',
  amount: 299, 
  currency: 'USD',
  product_id: 'prod-123',
  product_name: 'Premium Plan'
});
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
- 🔐 [npm Package Access](https://www.npmjs.com/package/minihog-sdk/access)
- 🌐 [Dashboard](https://minihog.ayushnautiyal.com)
- 📚 [Main Documentation](../../../README.md)
- 🏗️ [Architecture](./docs/ARCHITECTURE.md)
- 💻 [GitHub Repository](https://github.com/ayushnau/minihog)
