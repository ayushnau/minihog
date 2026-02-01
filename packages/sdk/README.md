# MiniHog SDK

JavaScript SDK for MiniHog analytics.

## Installation

```bash
npm install
npm run build
```

## Usage

```javascript
import MiniHog from 'minihog-sdk';

MiniHog.init({
  endpoint: 'http://localhost:3000',
  batchSize: 10,
  flushInterval: 5000,
});

MiniHog.track('app_open');
MiniHog.track('purchase', { amount: 299 });
```

## Features

- Event batching
- Automatic retry with exponential backoff
- Session management (distinct ID persistence)
- Auto-flush on page unload

## Development

- `npm run build` - Build TypeScript
- `npm run dev` - Watch mode

