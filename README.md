# MiniHog

A PostHog-inspired analytics and attribution engine built with Node.js, PostgreSQL, and TypeScript.

MiniHog is a lightweight analytics backend focused on event ingestion, analytics primitives, and attribution. It demonstrates production-style systems engineering with a clean, well-organized codebase.

## 📚 Documentation

All documentation is organized in the [`docs/`](./docs/) folder:

- **[Setup Guide](./docs/setup/SETUP.md)** - Local development setup
- **[Deployment Guides](./docs/deployment/)** - Deploy to Vercel, Supabase, etc.
- **[Troubleshooting](./docs/troubleshooting/)** - Common issues and solutions

Quick links:
- [Quick Deploy](./docs/deployment/QUICK_DEPLOY.md)
- [Vercel + Supabase Setup](./docs/deployment/DEPLOY_VERCEL_SUPABASE.md)
- [CORS Configuration](./docs/troubleshooting/CORS_SETUP.md)

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────────────────────────────┐
│   Client App    │         │           Dashboard (Next.js)            │
│   (Browser)     │         │  React + Tailwind + shadcn-ui + Recharts │
└────────┬────────┘         └──────────────────┬───────────────────────┘
         │ JS SDK                              │ API Proxy (JWT Auth)
         │ (track, flush)                      │
         v                                     v
┌──────────────────────────────────────────────────────────┐
│                   Backend API (Express)                   │
│                                                          │
│  ┌──────────┐  ┌────────────┐  ┌───────────────────────┐ │
│  │ Ingestion│  │    Auth     │  │   Analytics Engine    │ │
│  │ /track   │  │ /api/auth   │  │ events, funnel,       │ │
│  │ /click   │  │ JWT + Keys  │  │ retention, attribution│ │
│  │ /install │  │             │  │ timeseries, journeys  │ │
│  └────┬─────┘  └─────┬──────┘  └──────────┬────────────┘ │
│       │              │                     │              │
│       v              v                     v              │
│  ┌──────────────────────────────────────────────┐        │
│  │          Prisma ORM + PostgreSQL              │        │
│  │  Events | Clicks | Installs | Users | ApiKeys │        │
│  └──────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────┘
```

### Event Ingestion Flow

```
Client App                        SDK                           API                         PostgreSQL
   │                               │                             │                              │
   │  MiniHog.track(event, props)  │                             │                              │
   │──────────────────────────────>│                             │                              │
   │                               │  (queue event locally)      │                              │
   │                               │──────┐                      │                              │
   │                               │      │ batch full /         │                              │
   │                               │<─────┘ flush interval /     │                              │
   │                               │        page unload          │                              │
   │                               │                             │                              │
   │                               │  POST /track/batch          │                              │
   │                               │  X-API-Key: <key>           │                              │
   │                               │────────────────────────────>│                              │
   │                               │                             │  Validate API key            │
   │                               │                             │─────────────────────────────>│
   │                               │                             │  Idempotency check           │
   │                               │                             │─────────────────────────────>│
   │                               │                             │  Batch insert events         │
   │                               │                             │─────────────────────────────>│
   │                               │                             │                              │
   │                               │         200 OK              │                              │
   │                               │<────────────────────────────│                              │
```

### Attribution Flow (Last-Click)

```
1. Click recorded:     POST /click { device_id, campaign_id, timestamp }
                         │
                         v
                       Clicks table stores the click
                         
2. Install recorded:   POST /install { device_id, timestamp }
                         │
                         v
                       Attribution Engine runs:
                         │
                         ├── Query all clicks for this device_id
                         │   within the attribution window (default 24h)
                         │
                         ├── Select the most recent click (last-click model)
                         │
                         └── Store attributed_campaign_id with the install

3. Subsequent events:  Events can carry the attributed_campaign_id
                       for campaign performance analysis
```

### Dashboard Authentication Flow

```
Browser                     Dashboard (Next.js)              Backend API
   │                              │                              │
   │  POST /signin                │                              │
   │  { username, password }      │                              │
   │─────────────────────────────>│                              │
   │                              │  POST /api/auth/login        │
   │                              │─────────────────────────────>│
   │                              │                              │  Verify credentials
   │                              │                              │  Issue JWT (HS256)
   │                              │     Set auth-token cookie    │
   │                              │<─────────────────────────────│
   │  Set HTTP-only cookie        │                              │
   │<─────────────────────────────│                              │
   │                              │                              │
   │  GET /dashboard              │                              │
   │─────────────────────────────>│                              │
   │                              │  GET /api/analytics/events   │
   │                              │  (forwards JWT cookie)       │
   │                              │─────────────────────────────>│
   │                              │                              │  Validate JWT
   │                              │                              │  Fetch user's API keys
   │                              │                              │  Query events filtered
   │                              │                              │  by userId/apiKeyIds
   │                              │       Analytics data         │
   │                              │<─────────────────────────────│
   │     Rendered dashboard       │                              │
   │<─────────────────────────────│                              │
```

## 📦 Monorepo Structure

This project uses [Turborepo](https://turbo.build/) for monorepo management:

```
minihog/
├── packages/
│   ├── api/          # Backend API (Express + Prisma + PostgreSQL)
│   ├── dashboard/    # Next.js Dashboard (React + Tailwind)
│   └── sdk/          # JavaScript SDK (npm package)
├── docs/             # Documentation
│   ├── deployment/   # Deployment guides
│   ├── setup/        # Setup guides
│   └── troubleshooting/ # Troubleshooting guides
├── scripts/          # Utility scripts
├── turbo.json        # Turborepo configuration
└── package.json      # Root workspace configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+ (or use Supabase)
- npm or yarn

### Quick Setup

See the [Setup Guide](./docs/setup/SETUP.md) for detailed instructions.

**TL;DR:**

```bash
# 1. Install dependencies
npm install

# 2. Set up database (PostgreSQL/Supabase)
# See docs/setup/SETUP.md or docs/deployment/SUPABASE_SETUP.md

# 3. Configure environment variables
cd packages/api
# Create .env with DATABASE_URL

# 4. Run migrations
npx prisma migrate deploy
npx prisma generate

# 5. Start development
npm run dev
```

The API will be available at `http://localhost:3000`  
The Dashboard will be available at `http://localhost:3002`

## 📚 API Endpoints

### Authentication

All event ingestion and analytics endpoints require an API key via one of:
- `X-API-Key` header
- `Authorization: Bearer <key>` header
- `?api_key=<key>` query parameter

Dashboard endpoints require JWT authentication via the `auth-token` cookie.

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

### Dashboard Analytics (JWT Required)

**GET `/dashboard/analytics/events`** - Comprehensive event analytics with optional params:
- `include_time_series=true` - Include time series data
- `include_properties=true` - Include properties breakdown
- `include_journeys=true` - Include user journeys
- `property_key=page` - Property key to break down by
- `granularity=day|hour` - Time series granularity

**GET `/dashboard/analytics/funnel`** - User-scoped funnel analysis

**GET `/dashboard/analytics/retention`** - User-scoped retention analysis

**GET `/dashboard/analytics/attribution`** - User-scoped attribution data

### Auth & Key Management

- **POST `/api/auth/register`** - Create account
- **POST `/api/auth/login`** - Login (returns JWT in `auth-token` cookie)
- **POST `/api/auth/logout`** - Clear auth token
- **GET `/api/auth/me`** - Current user profile
- **POST `/api/auth/change-password`** - Update password
- **POST `/api/keys`** - Generate new API key
- **GET `/api/keys`** - List user's API keys
- **DELETE `/api/keys?id={id}`** - Revoke an API key

## 📦 JavaScript SDK

### Installation

```bash
npm install minihog-sdk
```

### Usage

```javascript
import MiniHog from 'minihog-sdk';

// Initialize with environment (no need to specify endpoint)
MiniHog.init({
  environment: 'production', // or 'sandbox' or 'development'
  apiKey: 'your-api-key', // Required
  batchSize: 10,
  flushInterval: 5000,
});

// Track page views (for user behavior analysis)
MiniHog.track('page_view', { page: '/home' });
MiniHog.track('page_view', { page: '/pricing' });

// Track button clicks with button IDs and page context
MiniHog.track('button_click', { 
  page: '/home',
  button_id: 'signup-btn',
  button_name: 'signup',
  button_text: 'Sign Up Now'
});

// Track other interactive events (form submissions, link clicks, etc.)
MiniHog.track('form_submit', { 
  page: '/contact',
  form_id: 'contact-form',
  form_name: 'Contact Form'
});

MiniHog.track('link_click', { 
  page: '/blog',
  link_id: 'read-more-link',
  link_url: '/blog/article-1',
  link_text: 'Read More'
});

// Track conversions with page and event context
MiniHog.track('signup', { page: '/signup', plan: 'premium' });
MiniHog.track('purchase', { page: '/checkout', amount: 299, currency: 'INR' });

// Manually flush (events are auto-flushed on interval or page unload)
MiniHog.flush();
```

📦 **Published on npm**: [minihog-sdk](https://www.npmjs.com/package/minihog-sdk) | [Package Access](https://www.npmjs.com/package/minihog-sdk/access)

See [packages/sdk/README.md](./packages/sdk/README.md) for full documentation.

### SDK Features

- **Automatic batching** - Events are batched before sending
- **Retry logic** - Failed requests are retried with exponential backoff
- **Session management** - Distinct IDs are generated and persisted
- **Auto-flush** - Events are flushed on page unload or interval
- **Flexible event tracking** - Track page views, button clicks, form submissions, link clicks, and any custom events
- **Rich context** - Include page paths, button IDs, form IDs, and other contextual information with all events

## 🎯 Attribution Logic

MiniHog uses **last-click attribution**:

1. When an install event is recorded, the system looks for clicks from the same `device_id`
2. Clicks within the attribution window (default: 24 hours) are considered
3. The most recent click's `campaign_id` is assigned to the install
4. The attributed campaign is stored with the install and subsequent events

The attribution window is configurable via `ATTRIBUTION_WINDOW_HOURS` environment variable.

## 🗄️ Database Schema

### Events Table
- `id` (UUID, PK)
- `event_name` (String)
- `distinct_id` (String)
- `timestamp` (DateTime)
- `properties` (JSON)
- `attributed_campaign_id` (String, nullable)
- `api_key_id` (String, nullable) - Links event to API key
- `user_id` (String, nullable) - Links event to dashboard user

**Indexes:** `(event_name, timestamp)`, `(user_id, event_name, timestamp)`, `(api_key_id, event_name, timestamp)`, `distinct_id`, `timestamp`, `api_key_id`, `user_id`

### Clicks Table
- `id` (UUID, PK)
- `device_id` (String)
- `campaign_id` (String)
- `timestamp` (DateTime)

**Indexes:** `(device_id, timestamp)`, `campaign_id`

### Installs Table
- `id` (UUID, PK)
- `device_id` (String)
- `install_time` (DateTime)
- `attributed_campaign_id` (String, nullable)

**Indexes:** `device_id`, `attributed_campaign_id`, `install_time`

### Users Table
- `id` (UUID, PK)
- `username` (String, unique)
- `email` (String, unique)
- `password_hash` (String)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### API Keys Table
- `id` (UUID, PK)
- `user_id` (String, FK -> Users)
- `key` (String, unique)
- `name` (String)
- `last_used` (DateTime, nullable)
- `deleted_at` (DateTime, nullable) - Soft delete for revocation

**Indexes:** `user_id`, `key`, `deleted_at`

## 🧪 Testing

```bash
# Test API endpoints (API key required)
curl -X POST http://localhost:3000/track \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"event":"test","distinct_id":"user_1","properties":{}}'

# Test click tracking (no auth required)
curl -X POST http://localhost:3000/click \
  -H "Content-Type: application/json" \
  -d '{"device_id":"device_1","campaign_id":"campaign_1","timestamp":1706351800000}'

# Test analytics query
curl "http://localhost:3000/analytics/events?event=test&from=2026-01-01&to=2026-12-31" \
  -H "X-API-Key: your-api-key"
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

### Why PostgreSQL?

- **JSON support**: Native JSONB for flexible event properties
- **Reliability**: ACID compliance for analytics correctness
- **Indexing**: Efficient queries on time-series data
- **Supabase integration**: Easy deployment and scaling
- **Type safety**: Better type support than MySQL

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

