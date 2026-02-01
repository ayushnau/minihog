# MiniHog

A PostHog-inspired analytics and attribution engine built with Node.js, MySQL, and TypeScript.

MiniHog is a lightweight analytics backend focused on event ingestion, analytics primitives, and attribution. It demonstrates production-style systems engineering with a clean, well-organized codebase.

## 🏗️ Architecture

```
Client App
   |
   |  (JS SDK)
   v
Ingestion API  ---> Validation ---> Event Queue
                                   |
                                   v
                                MySQL
                                   |
                         Analytics & Attribution Engine
                                   |
                               Query APIs
```

## 📦 Monorepo Structure

This project uses [Turborepo](https://turbo.build/) for monorepo management:

```
minihog/
├── packages/
│   ├── api/          # Backend API (Express + Prisma + MySQL)
│   └── sdk/          # JavaScript SDK
├── turbo.json        # Turborepo configuration
└── package.json      # Root workspace configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MySQL 5.7+ or MariaDB 10.2+ (JSON support required)
- npm or yarn

### Setup

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up the database:**

```bash
# Create a MySQL database
mysql -u root -p -e "CREATE DATABASE minihog;"
```

3. **Configure environment variables:**

```bash
cd packages/api
cp .env.example .env
```

Edit `packages/api/.env` with your database connection:

```env
DATABASE_URL="mysql://user:password@localhost:3306/minihog"
PORT=3000
NODE_ENV=development
ATTRIBUTION_WINDOW_HOURS=24
```

4. **Run database migrations:**

```bash
cd packages/api
npm run db:generate
npm run db:migrate
```

5. **Start the API server:**

```bash
# From root
npm run dev

# Or from packages/api
cd packages/api
npm run dev
```

The API will be available at `http://localhost:3000`

## 📚 API Endpoints

### Event Ingestion

**POST `/track`** - Track a user event

```json
{
  "event": "purchase",
  "distinct_id": "user_123",
  "timestamp": 1706352000000,
  "properties": {
    "amount": 299,
    "currency": "INR"
  }
}
```

**POST `/click`** - Record a marketing click (for attribution)

```json
{
  "device_id": "device_abc",
  "campaign_id": "INSTAGRAM_12",
  "timestamp": 1706351800000
}
```

**POST `/install`** - Record an install event (triggers attribution)

```json
{
  "device_id": "device_abc",
  "timestamp": 1706352000000
}
```

### Analytics Queries

**GET `/analytics/events?event=purchase&from=2026-01-01&to=2026-01-07`**

Returns total event count and unique users.

**GET `/analytics/funnel?steps=install,signup,purchase&from=2026-01-01&to=2026-01-07`**

Returns funnel analysis with drop-off percentages.

**GET `/analytics/retention?cohort=install&day=7&from=2026-01-01&to=2026-01-07`**

Returns retention percentage (users who returned after N days).

**GET `/analytics/attribution`**

Returns attribution analytics (installs and purchases per campaign).

## 📦 JavaScript SDK

### Installation

```bash
cd packages/sdk
npm run build
```

### Usage

```javascript
import MiniHog from 'minihog-sdk';

// Initialize
MiniHog.init({
  endpoint: 'http://localhost:3000',
  batchSize: 10,
  flushInterval: 5000,
});

// Track events
MiniHog.track('app_open');
MiniHog.track('purchase', { amount: 299, currency: 'INR' });

// Manually flush (events are auto-flushed on interval or page unload)
MiniHog.flush();
```

### SDK Features

- **Automatic batching** - Events are batched before sending
- **Retry logic** - Failed requests are retried with exponential backoff
- **Session management** - Distinct IDs are generated and persisted
- **Auto-flush** - Events are flushed on page unload or interval

## 🎯 Attribution Logic

MiniHog uses **last-click attribution**:

1. When an install event is recorded, the system looks for clicks from the same `device_id`
2. Clicks within the attribution window (default: 24 hours) are considered
3. The most recent click's `campaign_id` is assigned to the install
4. The attributed campaign is stored with the install and subsequent events

The attribution window is configurable via `ATTRIBUTION_WINDOW_HOURS` environment variable.

## 🗄️ Database Schema

### Events Table
- `id` (String/CUID, PK)
- `event_name` (String)
- `distinct_id` (String)
- `timestamp` (DateTime)
- `properties` (JSON)
- `attributed_campaign_id` (String, nullable)

**Indexes:** `(event_name, timestamp)`, `distinct_id`, `timestamp`

### Clicks Table
- `id` (String/CUID, PK)
- `device_id` (String)
- `campaign_id` (String)
- `timestamp` (DateTime)

**Indexes:** `(device_id, timestamp)`, `campaign_id`

### Installs Table
- `id` (String/CUID, PK)
- `device_id` (String)
- `install_time` (DateTime)
- `attributed_campaign_id` (String, nullable)

**Indexes:** `device_id`, `attributed_campaign_id`, `install_time`

## 🧪 Testing

```bash
# Run all tests (when implemented)
npm test

# Test API endpoints
curl -X POST http://localhost:3000/track \
  -H "Content-Type: application/json" \
  -d '{"event":"test","distinct_id":"user_1","properties":{}}'
```

## 🛠️ Development

### Build all packages

```bash
npm run build
```

### Run in development mode

```bash
npm run dev
```

### Database management

```bash
cd packages/api

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

## 📝 Design Decisions & Tradeoffs

### Why Turborepo?

- **Monorepo benefits**: Shared types, easier development, atomic changes
- **Turborepo**: Fast builds with intelligent caching, simple configuration

### Why Prisma?

- **Type safety**: Auto-generated TypeScript types from schema
- **Developer experience**: Great migrations, Prisma Studio for debugging
- **Performance**: Efficient queries with proper indexing

### Why MySQL?

- **JSON support**: Flexible event properties storage (MySQL 5.7+)
- **Reliability**: ACID compliance for analytics correctness
- **Indexing**: Efficient queries on time-series data
- **Wide adoption**: Popular, well-supported database

### Why Express?

- **Simplicity**: Minimal framework, easy to understand
- **Flexibility**: Easy to add middleware, custom logic
- **Mature**: Well-documented, widely used

### Attribution Window

- **Configurable**: Set via environment variable
- **Default 24h**: Industry standard for mobile attribution
- **Last-click**: Simple, explainable model (can be extended)

### SDK Batching

- **Reduces API calls**: Better performance, lower server load
- **Configurable batch size**: Balance between latency and efficiency
- **Auto-flush**: Ensures events aren't lost on page unload

## 🚧 Future Enhancements (Out of Scope)

- Feature flags
- Session replay
- Multi-touch attribution models
- ClickHouse / Kafka for scale
- Real-time dashboards
- Mobile SDKs

## 📄 License

MIT

## 🤝 Contributing

This is a demonstration project. Contributions welcome for:
- Bug fixes
- Performance improvements
- Additional analytics queries
- SDK enhancements

