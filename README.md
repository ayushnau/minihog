<img src="https://raw.githubusercontent.com/ayushnautiyal/minihog/refs/heads/main/.github/banner.png" alt="MiniHog Banner" width="100%" />

<div align="center">

# MiniHog

**Self-hosted product analytics & attribution — built for makers who want full control.**

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/built%20with-TypeScript-3178c6.svg)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/runtime-Node.js%2018%2B-339933.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-4169e1.svg)](https://postgresql.org)

[Live Demo](https://dashboard-two-bice-3g9ewrov9e.vercel.app) · [Analytics Docs](./docs/ANALYTICS.md) · [Deploy Guide](./docs/deployment/QUICK_DEPLOY.md)

</div>

---

## What is MiniHog?

MiniHog is a **PostHog-inspired, open-source analytics platform** you can host yourself. It tracks user events from any web app, visualises funnels and retention, attributes installs to marketing campaigns, and now ships with an **AI assistant** you can point at your own Gemini key or local Ollama model.

No data leaves your infrastructure. No per-event pricing. No vendor lock-in.

---

## Features

### Event Tracking
Drop in the SDK, call `track()`, and every user action lands in your own PostgreSQL database. Events batch automatically, retry on failure, and flush on page unload.

### Funnel Analysis
Define any multi-step conversion path and instantly see where users drop off — with exact user counts and drop-off percentages at every step. Property filters let you narrow to specific button labels, page URLs, or any custom property.

### Retention Cohorts
See what percentage of users who did action A came back and did action B on day N. The heatmap view shows all cohort dates at once so you can spot trends over time.

### Last-Click Attribution
Every ad click is recorded with a `device_id`. When an install follows within the attribution window (default 24h), MiniHog links it back to the originating campaign — no mobile SDK required.

### AI Analytics Assistant
Ask questions about your data in plain English. The assistant calls your real live data (funnels, retention, event counts) and surfaces insights with one-click **Apply** buttons that pre-fill the dashboard. Works with:
- **Google Gemini** — enter your API key in Settings
- **Local Ollama** — runs entirely in your browser, data never leaves your machine

### Live Event Stream
Watch events flow in real-time on the Overview page. See which users are active right now and what they're doing.

### Full Dashboard
- Overview KPIs with sparklines
- Per-event time series with property breakdown
- Funnel builder with drag-to-reorder steps
- Retention heatmap
- Campaign attribution pie charts
- API key management with soft-delete revocation

---

## Architecture

```
┌─────────────────┐         ┌─────────────────────────────────────────┐
│   Your App      │         │        Dashboard  (Next.js 14)          │
│                 │         │  Auth · Funnel · Retention · Attribution │
│  minihog-sdk    │         │  AI Assistant (Gemini / Ollama)         │
└────────┬────────┘         └──────────────────┬──────────────────────┘
         │ POST /track/batch                   │ JWT cookie
         │ X-API-Key header                    │
         ▼                                     ▼
┌──────────────────────────────────────────────────────────┐
│                   Backend API  (Express)                  │
│                                                          │
│  Ingestion          Auth / Keys        Analytics Engine  │
│  /track /click      JWT + API Keys     events, funnel,   │
│  /install           bcrypt             retention,         │
│                                        attribution, AI   │
│                                                          │
│            Prisma ORM  ──►  PostgreSQL                   │
│      events · clicks · installs · users · api_keys       │
└──────────────────────────────────────────────────────────┘
```

### Event Ingestion

```
Your App          SDK (browser)             Backend API         PostgreSQL
   │                   │                        │                   │
   │  .track(evt,props)│                        │                   │
   │──────────────────>│                        │                   │
   │                   │  buffer in memory      │                   │
   │                   │  (batch ≥10 or 5s)     │                   │
   │                   │  POST /track/batch     │                   │
   │                   │  X-API-Key: <key>      │                   │
   │                   │───────────────────────>│                   │
   │                   │                        │  validate key     │
   │                   │                        │──────────────────>│
   │                   │                        │  batch INSERT     │
   │                   │                        │──────────────────>│
   │                   │        200 OK          │                   │
   │                   │<───────────────────────│                   │
```

### Analytics Query

```
Browser           Dashboard (Next.js)         Backend API         PostgreSQL
   │                    │                          │                   │
   │  view Funnel page  │                          │                   │
   │───────────────────>│                          │                   │
   │                    │  GET /api/analytics/     │                   │
   │                    │  funnel?steps=...        │                   │
   │                    │  (auth-token cookie)     │                   │
   │                    │─────────────────────────>│                   │
   │                    │                          │  validate JWT     │
   │                    │                          │  extract userId   │
   │                    │                          │  funnel query     │
   │                    │                          │──────────────────>│
   │                    │                          │  step counts +    │
   │                    │                          │  drop-off %       │
   │                    │                          │<──────────────────│
   │                    │       JSON response      │                   │
   │                    │<─────────────────────────│                   │
   │  funnel chart      │                          │                   │
   │<───────────────────│                          │                   │
```

### Attribution (Last-Click)

```
Ad Network  →  POST /click { device_id, campaign_id }  →  clicks table
                                                              │
App Install →  POST /install { device_id }                   │
                    │                                         │
                    └── find latest click within 24h window ─┘
                              │
                              ▼
                    installs table (attributed_campaign_id)
                    events table   (install event)
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or [Supabase](https://supabase.com) free tier)

### Local Setup

```bash
git clone https://github.com/ayushnautiyal/minihog
cd minihog
npm install

# Configure environment
cp packages/api/.env.example packages/api/.env
cp packages/dashboard/.env.example packages/dashboard/.env.local
# → fill in DATABASE_URL and JWT_SECRET (must match in both)

# Push schema
cd packages/api && npx prisma db push && cd ../..
cd packages/dashboard && npx prisma db push && cd ../..

# Start everything
npm run dev
# API  → http://localhost:3000
# Dashboard → http://localhost:3002
```

### SDK Integration

```bash
npm install minihog-sdk
```

```javascript
import MiniHog from 'minihog-sdk';

MiniHog.init({
  apiKey: 'your-api-key',   // generate one in the dashboard
  environment: 'production', // or 'development' for localhost
});

MiniHog.track('page_view',    { page: '/home' });
MiniHog.track('button_click', { page: '/pricing', button_id: 'cta-buy' });
MiniHog.track('purchase',     { amount: 299, currency: 'USD' });
```

Events batch automatically (10 at a time or every 5 seconds) and flush on page unload.

---

## Deploy to Vercel + Supabase

See the [full deployment guide](./docs/deployment/DEPLOY_VERCEL_SUPABASE.md).

**TL;DR:**

```bash
# Deploy API
vercel --cwd packages/api --prod

# Deploy Dashboard
vercel --cwd packages/dashboard --prod
```

Set environment variables in the Vercel dashboard for each project. Use Supabase's **connection pooler URL** (port 6543) for `DATABASE_URL`.

---

## Documentation

| Doc | What's inside |
|-----|--------------|
| [Analytics Logic](./docs/ANALYTICS.md) | How events, funnels, retention, and attribution are calculated |
| [Setup Guide](./docs/setup/SETUP.md) | Local development setup |
| [Deployment Guide](./docs/deployment/DEPLOY_VERCEL_SUPABASE.md) | Vercel + Supabase production deploy |
| [Troubleshooting](./docs/troubleshooting/CORS_SETUP.md) | CORS and common issues |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| SDK | Vanilla TypeScript, zero dependencies |
| API | Express.js, Prisma ORM, Zod validation |
| Dashboard | Next.js 14 (App Router), React 18, Tailwind CSS |
| Charts | Recharts |
| Auth | JWT (jose) + bcryptjs |
| Database | PostgreSQL (Supabase in production) |
| Monorepo | Turborepo + npm workspaces |
| AI | Google Gemini API / Ollama (local) |

---

## License

MIT — use it, fork it, ship it.
