# MiniHog API

Backend API for MiniHog analytics engine built with Express.js, Prisma, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+ (or use Supabase)
- npm or yarn

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/minihog"
PORT=3000
NODE_ENV=development
ATTRIBUTION_WINDOW_HOURS=24
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
CORS_ORIGIN="http://localhost:3001,https://your-dashboard-domain.com"
```

3. **Run database migrations:**
```bash
npx prisma generate
npx prisma migrate deploy
# Or for development:
npx prisma db push
```

4. **Start the server:**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📡 API Endpoints

### Event Ingestion (Requires API Key)

#### `POST /track`
Track a user event. Requires API key authentication via `X-API-Key` header.

**Request:**
```json
{
  "event": "purchase",
  "distinct_id": "user_123",
  "timestamp": 1706352000000,
  "properties": {
    "amount": 299,
    "currency": "INR",
    "page": "/checkout"
  },
  "event_id": "optional-id-for-idempotency"
}
```

**Example: Tracking Page Views**
```json
{
  "event": "page_view",
  "distinct_id": "user_123",
  "properties": {
    "page": "/home",
    "page_title": "Homepage"
  }
}
```

**Example: Tracking Button Clicks with IDs**
```json
{
  "event": "button_click",
  "distinct_id": "user_123",
  "properties": {
    "page": "/home",
    "button_id": "signup-btn",
    "button_name": "signup",
    "button_text": "Sign Up Now"
  }
}
```

**Example: Tracking Form Submissions**
```json
{
  "event": "form_submit",
  "distinct_id": "user_123",
  "properties": {
    "page": "/contact",
    "form_id": "contact-form",
    "form_name": "Contact Form"
  }
}
```

**Example: Tracking Link Clicks**
```json
{
  "event": "link_click",
  "distinct_id": "user_123",
  "properties": {
    "page": "/blog",
    "link_id": "read-more-link",
    "link_url": "/blog/article-1",
    "link_text": "Read More"
  }
}
```

**Response:**
```json
{
  "success": true,
  "event_id": "clx..."
}
```

**Authentication:**
- Header: `X-API-Key: your-api-key`
- Header: `Authorization: Bearer your-api-key`
- Query: `?api_key=your-api-key` (GET requests only)

#### `POST /click`
Record a marketing click for attribution.

**Request:**
```json
{
  "device_id": "device_abc",
  "campaign_id": "INSTAGRAM_12",
  "timestamp": 1706351800000
}
```

#### `POST /install`
Record an install event (triggers attribution logic).

**Request:**
```json
{
  "device_id": "device_abc",
  "timestamp": 1706352000000
}
```

### Public Analytics (No Authentication)

#### `GET /analytics/events?event=purchase&from=2026-01-01&to=2026-01-07`
Returns total event count and unique users.

**Response:**
```json
{
  "success": true,
  "event": "purchase",
  "from": "2026-01-01T00:00:00.000Z",
  "to": "2026-01-07T23:59:59.999Z",
  "total_count": 150,
  "unique_users": 120
}
```

#### `GET /analytics/funnel?steps=install,signup,purchase&from=2026-01-01&to=2026-01-07`
Returns funnel analysis with drop-off percentages.

#### `GET /analytics/retention?cohort=install&day=7&from=2026-01-01&to=2026-01-07`
Returns retention percentage (users who returned after N days).

#### `GET /analytics/attribution`
Returns attribution analytics (installs and purchases per campaign).

### Dashboard Analytics (Requires JWT Authentication)

These endpoints are used by the dashboard and require JWT authentication. They automatically filter data by the authenticated user's API keys.

#### `GET /dashboard/analytics/events?event=purchase&from=2026-01-01&to=2026-01-07`
User-specific event analytics with comprehensive insights.

**Query Parameters:**
- `event` (required) - Event name to analyze
- `from` (optional) - Start date (YYYY-MM-DD)
- `to` (optional) - End date (YYYY-MM-DD)
- `include_time_series` (optional) - Include time series data (true/false)
- `include_properties` (optional) - Include properties breakdown (true/false)
- `include_journeys` (optional) - Include user journeys (true/false)
- `property_key` (optional) - Property to breakdown by (default: 'page')
- `granularity` (optional) - Time series granularity: 'day' or 'hour' (default: 'day')

**Response includes:**
- Total count and unique users
- Time series data (daily/hourly trends)
- Properties breakdown (e.g., by page name)
- Individual user journeys
- Common user paths

#### `GET /dashboard/analytics/funnel?steps=install,signup,purchase&from=2026-01-01&to=2026-01-07`
User-specific funnel analysis.

#### `GET /dashboard/analytics/retention?cohort=install&day=7&from=2026-01-01&to=2026-01-07`
User-specific retention analysis.

#### `GET /dashboard/analytics/attribution`
User-specific attribution analytics.

**Authentication:**
- Cookie: `auth-token` (HTTP-only cookie set by dashboard)
- Header: `Authorization: Bearer <jwt-token>`

### Health Check

#### `GET /health`
Health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-15T10:30:00.000Z",
  "database": "configured"
}
```

## 🗄️ Database

Uses **Prisma ORM** with **PostgreSQL**. Schema is defined in `prisma/schema.prisma`.

### Schema Overview

- **Events** - User events with properties, timestamps, and API key association
- **Clicks** - Marketing click tracking for attribution
- **Installs** - Install events with attributed campaigns
- **Users** - Dashboard user accounts (username, email, password hash)
- **ApiKeys** - API keys linked to users for event tracking

### Database Commands

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# For development (pushes schema without migrations)
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio

# View migration status
npx prisma migrate status
```

## 🔐 Authentication & Authorization

### API Key Authentication
- Used for event ingestion (`/track`, `/click`, `/install`)
- Validates API key and associates events with the key
- Updates `lastUsed` timestamp on each request

### JWT Authentication
- Used for dashboard analytics endpoints
- Validates JWT token from cookie or Authorization header
- Extracts user ID and fetches associated API keys
- Filters analytics data by user's API keys (data isolation)

## 🛠️ Development

### Scripts

```bash
# Development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate

# Push schema changes (development)
npm run db:push

# Open Prisma Studio
npm run db:studio
```

### Project Structure

```
packages/api/
├── src/
│   ├── index.ts              # Express app setup
│   ├── db/
│   │   └── client.ts        # Prisma client initialization
│   ├── middleware/
│   │   ├── apiKeyAuth.ts    # API key validation
│   │   ├── jwtAuth.ts       # JWT validation
│   │   └── errorHandler.ts  # Global error handling
│   ├── routes/
│   │   ├── track.ts         # Event ingestion
│   │   ├── click.ts         # Click tracking
│   │   ├── install.ts       # Install tracking
│   │   ├── analytics.ts     # Public analytics
│   │   └── dashboardAnalytics.ts # Dashboard analytics (JWT)
│   └── services/
│       ├── analytics/       # Analytics query logic
│       └── attribution.ts   # Attribution logic
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/         # Database migrations
└── vercel.json             # Vercel deployment config
```

## 🚢 Deployment

### Vercel Deployment

The API is configured for Vercel serverless functions. See [deployment docs](../../../docs/deployment/) for details.

**Key Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `CORS_ORIGIN` - Comma-separated list of allowed origins
- `ATTRIBUTION_WINDOW_HOURS` - Attribution window (default: 24)

## 🎯 Attribution Logic

MiniHog uses **last-click attribution**:

1. When an install event is recorded, the system looks for clicks from the same `device_id`
2. Clicks within the attribution window (default: 24 hours) are considered
3. The most recent click's `campaign_id` is assigned to the install
4. The attributed campaign is stored with the install and subsequent events

The attribution window is configurable via `ATTRIBUTION_WINDOW_HOURS` environment variable.

## 🔒 Security Features

- ✅ **API Key Validation** - All event ingestion requires valid API keys
- ✅ **JWT Authentication** - Secure dashboard access with HTTP-only cookies
- ✅ **Data Isolation** - Users only see data from their own API keys
- ✅ **Input Validation** - Zod schemas for all endpoints
- ✅ **Global Error Handling** - User-friendly error messages
- ✅ **CORS Protection** - Configurable origin whitelist
- ✅ **SQL Injection Protection** - Prisma ORM prevents SQL injection

## 📚 Related Documentation

- [Main README](../../../README.md)
- [Deployment Guide](../../../docs/deployment/)
- [Troubleshooting](../../../docs/troubleshooting/)
