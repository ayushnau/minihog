# MiniHog Analytics — How It Works

This document explains the logic behind every analytics primitive in MiniHog: what gets calculated, how the numbers are derived, and the sequence of operations from query to result.

---

## Table of Contents

1. [Event Tracking](#1-event-tracking)
2. [Event Counts & Time Series](#2-event-counts--time-series)
3. [Funnel Analysis](#3-funnel-analysis)
4. [Retention Analysis](#4-retention-analysis)
5. [Attribution (Last-Click)](#5-attribution-last-click)
6. [AI Assistant](#6-ai-assistant)
7. [Data Isolation (Multi-tenant)](#7-data-isolation-multi-tenant)

---

## 1. Event Tracking

### What an event is

Every user action is recorded as a row in the `events` table:

```
event_name      TEXT        e.g. "page_view", "button_click", "purchase"
distinct_id     TEXT        anonymous or identified user ID
timestamp       DATETIME    when the event happened (client-supplied)
properties      JSONB       any key-value pairs you attach
user_id         UUID        links to the dashboard user who owns this data
api_key_id      UUID        the API key used to ingest it
```

### How the SDK sends events

The SDK buffers events in memory and flushes them as a batch:

```
track("page_view", { page: "/home" })
    │
    ▼
In-memory queue
    │
    ├── when queue.length >= batchSize (default 10)
    ├── when flushInterval fires (default 5 000 ms)
    └── on window "beforeunload"
    │
    ▼
POST /track/batch
X-API-Key: <key>
Body: [ { event, distinct_id, timestamp, properties }, ... ]
    │
    ▼
API validates key → prisma.$transaction → bulk INSERT into events
```

**Retry logic:** if the request fails, the SDK retries up to 3 times with exponential backoff (1s → 2s → 4s).

**Idempotency:** events can carry an optional `event_id`. The DB has a unique index on it — duplicate submissions are silently ignored.

---

## 2. Event Counts & Time Series

### What gets calculated

For a given event name and date range, MiniHog returns:

| Metric | How it's computed |
|--------|-------------------|
| **Total count** | `COUNT(*)` where `event_name = ? AND timestamp BETWEEN ? AND ?` |
| **Unique users** | `COUNT(DISTINCT distinct_id)` on the same filter |
| **Time series** | `GROUP BY DATE(timestamp)` (or hour), returning count per bucket |
| **Properties breakdown** | `GROUP BY properties->>'key'`, top 20 values by frequency |
| **User journeys** | Per-user ordered event sequences, top 50 distinct paths |

### Sequence diagram

```
Dashboard           Next.js proxy          Express API             PostgreSQL
    │                    │                      │                       │
    │  GET /api/events   │                      │                       │
    │  ?event=page_view  │                      │                       │
    │  &from=...&to=...  │                      │                       │
    │───────────────────>│                      │                       │
    │                    │  GET /dashboard/     │                       │
    │                    │  analytics/events    │                       │
    │                    │  Authorization: JWT  │                       │
    │                    │─────────────────────>│                       │
    │                    │                      │  validate JWT         │
    │                    │                      │  extract userId       │
    │                    │                      │                       │
    │                    │                      │  Promise.all([        │
    │                    │                      │    COUNT(*),          │
    │                    │                      │    COUNT(DISTINCT id),│
    │                    │                      │    GROUP BY date,     │
    │                    │                      │    GROUP BY prop,     │
    │                    │                      │    user journeys      │
    │                    │                      │  ])                   │
    │                    │                      │──────────────────────>│
    │                    │                      │      results          │
    │                    │                      │<──────────────────────│
    │                    │       JSON           │                       │
    │                    │<─────────────────────│                       │
    │  Recharts render   │                      │                       │
    │<───────────────────│                      │                       │
```

All five sub-queries run in parallel (`Promise.all`) to keep latency low.

---

## 3. Funnel Analysis

### The concept

A funnel answers: "Of the users who did step 1, how many went on to do step 2, then step 3?"

It measures **ordered conversion** — a user must complete step N before they count toward step N+1.

### How MiniHog calculates it

The algorithm runs one sub-query per step:

```
Step 1:  users who did event_A in [from, to]
             → user set S1

Step 2:  users in S1 who also did event_B AFTER their first event_A
             → user set S2

Step 3:  users in S2 who also did event_C AFTER their first event_B
             → user set S3

...
```

Each step's result set is intersected with the previous step — so a user only counts at step N if they completed all prior steps in order.

For each step the API returns:

| Field | Meaning |
|-------|---------|
| `step` | Step number (1-based) |
| `event_name` | The event tracked at this step |
| `users` | Users who reached this step |
| `drop_off_percentage` | % of the previous step's users who did NOT continue |

**Overall conversion** = `users at last step / users at first step × 100`.

**Property filters:** each step can optionally filter on a JSON property key + value (e.g. `button_label = "Buy Now"`). The sub-query adds a `WHERE properties->>'key' = 'value'` clause.

### Sequence diagram

```
Funnel page         API proxy              Express API            PostgreSQL
    │                   │                      │                       │
    │  POST funnel       │                      │                       │
    │  steps=[A,B,C]     │                      │                       │
    │──────────────────>│                      │                       │
    │                   │  GET /dashboard/     │                       │
    │                   │  analytics/funnel    │                       │
    │                   │─────────────────────>│                       │
    │                   │                      │  for each step:       │
    │                   │                      │    SELECT distinct_id  │
    │                   │                      │    WHERE event=stepN  │
    │                   │                      │    AND distinct_id IN │
    │                   │                      │    (prev step set)    │
    │                   │                      │    AND timestamp >    │
    │                   │                      │    (user's prev ts)   │
    │                   │                      │──────────────────────>│
    │                   │                      │  step counts          │
    │                   │                      │<──────────────────────│
    │                   │                      │  compute drop-off %   │
    │                   │       JSON           │                       │
    │                   │<─────────────────────│                       │
    │  render bars       │                      │                       │
    │<──────────────────│                      │                       │
```

### Example

```
Step 1  page_view        → 153 users
Step 2  menu_view        → 76 users   (50.3% dropped off from step 1)
Step 3  order_item_added → 48 users   (36.8% dropped off from step 2)
Step 4  order_completed  →  4 users   (91.7% dropped off from step 3)

Overall conversion: 4 / 153 = 2.6%
```

---

## 4. Retention Analysis

### The concept

Retention answers: "Of the users who did action A on day D, how many came back and did action B on day D+N?"

This is **cohort-based** retention — users are grouped by when they first did the cohort event.

### How MiniHog calculates it

```
1. Define cohort event (e.g. "signup") and return event (e.g. "page_view")
2. For each calendar day in [from, to]:
   a. Find all distinct_ids that did the cohort event on that day  → cohort
   b. For each retention day N in [1, 3, 7, 14, 21, 28]:
      count how many of that cohort's users did the return event
      on or after (cohort_date + N days) and before (cohort_date + N+1 days)
   c. retention_rate = retained_users / cohort_size × 100
3. Return a heatmap: rows = cohort dates, columns = day N values
```

The heatmap is then visualised as a colour-coded grid where darker = higher retention.

**Cohort average** = mean of all non-null values in a given day-N column.

### Sequence diagram

```
Retention page      API proxy             Express API             PostgreSQL
    │                   │                     │                        │
    │  GET retention    │                     │                        │
    │  cohort=signup    │                     │                        │
    │  days=[1,3,7,14]  │                     │                        │
    │──────────────────>│                     │                        │
    │                   │─────────────────────>                        │
    │                   │                     │  for each cohort day:  │
    │                   │                     │    get cohort users    │
    │                   │                     │    for each N:         │
    │                   │                     │      count returned    │
    │                   │                     │──────────────────────>│
    │                   │                     │  cohort × day matrix   │
    │                   │                     │<──────────────────────│
    │                   │      JSON           │                        │
    │                   │<────────────────────│                        │
    │  heatmap render   │                     │                        │
    │<──────────────────│                     │                        │
```

### Example

```
Cohort event: signup    Return event: page_view
Period: 2026-01-01 → 2026-01-31

Cohort date   Size   D1     D3     D7     D14
2026-01-01    12     58%    42%    33%    17%
2026-01-02     8     62%    50%    25%    12%
2026-01-03     5     40%    20%    20%    —
...

Column average       53%    37%    26%    15%
```

A D7 retention of 26% means 1 in 4 people who signed up came back on day 7.

---

## 5. Attribution (Last-Click)

### The concept

When a user sees an ad and then installs your app, you want to know which campaign drove that install. Last-click attribution credits the most recent ad click before the install.

### How MiniHog calculates it

```
1. A click is recorded:
   POST /click { device_id, campaign_id, timestamp }
   → stored in clicks table

2. An install is recorded:
   POST /install { device_id, timestamp }
   → attribution engine runs:

       SELECT campaign_id FROM clicks
       WHERE device_id = ?
         AND timestamp >= (install_time - ATTRIBUTION_WINDOW_HOURS)
         AND timestamp <= install_time
       ORDER BY timestamp DESC
       LIMIT 1

3. Result:
   ├── click found → store attributed_campaign_id with install
   └── no click    → install recorded as organic
```

The default window is **24 hours** (configurable via `ATTRIBUTION_WINDOW_HOURS` env var).

### Sequence diagram

```
Ad Network              MiniHog API                  PostgreSQL
    │                        │                             │
    │  User clicks ad        │                             │
    │  POST /click           │                             │
    │  { device_id,          │                             │
    │    campaign_id }       │                             │
    │───────────────────────>│                             │
    │                        │  INSERT into clicks         │
    │                        │────────────────────────────>│
    │                        │                             │
    │  User installs app     │                             │
    │  POST /install         │                             │
    │  { device_id }         │                             │
    │───────────────────────>│                             │
    │                        │  SELECT latest click        │
    │                        │  within 24h window          │
    │                        │────────────────────────────>│
    │                        │  campaign_id = "INSTA_12"   │
    │                        │<────────────────────────────│
    │                        │  INSERT installs            │
    │                        │  (attributed_campaign_id)   │
    │                        │────────────────────────────>│
    │                        │  INSERT event               │
    │                        │  (install, with campaign)   │
    │                        │────────────────────────────>│
    │        200 OK          │                             │
    │<───────────────────────│                             │
```



## 6. AI Assistant

The AI assistant is an **agentic loop** — it can call tools repeatedly until it has enough data to answer your question.

### Tool inventory

| Tool | What it does |
|------|-------------|
| `get_event_names` | Lists all tracked event names and their total counts |
| `get_event_schema` | Returns custom event schemas defined by the user |
| `query_events` | Total count + unique users + daily time series for one event |
| `query_funnel` | Runs a full funnel analysis for a list of event names |
| `query_retention` | N-day retention for a cohort event |
| `get_event_properties` | Property keys and top values for an event (90-day window) |
| `search_context` | Searches uploaded context documents (product docs, policies) |
| `suggest_action` | Emits a one-click Apply button to the dashboard UI |

### Ollama path (client-side)

When the user has configured a local Ollama model, the entire loop runs in the browser. No data goes to the backend AI route:

```
Browser
  │
  ├── runOllamaChat(userMessage)
  │     │
  │     ├── iter 1: POST ollamaUrl/v1/chat/completions
  │     │           model calls tool: get_event_names
  │     │           → fetch /api/analytics/event-names (cookie auth)
  │     │           → result added to messages
  │     │
  │     ├── iter 2: POST ollamaUrl/v1/chat/completions
  │     │           model calls tool: query_funnel
  │     │           → fetch /api/analytics/funnel (cookie auth)
  │     │           → result added to messages
  │     │
  │     ├── iter 3: POST ollamaUrl/v1/chat/completions
  │     │           model calls: suggest_action
  │     │           → onAction callback → renders Apply button in UI
  │     │
  │     └── iter 4: POST ollamaUrl/v1/chat/completions
  │                 finish_reason = stop, no tool_calls
  │                 → loop ends, final text streamed to user
  │
  └── conversation history stored in useRef (in-memory, not persisted)
```

### Gemini path (backend proxy)

When using Gemini, the request goes through the Next.js proxy to the Express backend, which runs the same agentic loop server-side using the Gemini API. The conversation is persisted to the `ai_sessions` table.

### Deduplication & loop prevention

The client-side loop tracks every `tool_name::args` pair it has already called. If the model tries to call the same tool with identical arguments again, it receives a cached result immediately — preventing infinite retry loops.

---

## 7. Data Isolation (Multi-tenant)

Every user's data is fully isolated from every other user.

**How isolation works:**

1. When a user generates an API key, that key is linked to their `user_id`
2. When the SDK tracks events using that key, each event row stores the `user_id` and `api_key_id`
3. When dashboard analytics queries run, the JWT is decoded to extract `userId`
4. Every SQL query adds `WHERE user_id = ?` — so users can only ever see their own events

**Fallback for older data:** if a row has no `user_id`, the query falls back to filtering by `api_key_id IN (...)` — the list of keys belonging to that user. This ensures backward compatibility without data loss.

```
JWT token → userId
               │
               ▼
        SELECT * FROM events
        WHERE user_id = userId        ← primary filter
           OR api_key_id IN (         ← fallback for legacy rows
             SELECT id FROM api_keys
             WHERE user_id = userId
             AND deleted_at IS NULL
           )
        AND event_name = ?
        AND timestamp BETWEEN ? AND ?
```

API keys use **soft deletion** — revoking a key sets `deleted_at` rather than removing the row. Historical events tracked with a revoked key remain visible in the dashboard; the key just can't ingest new events.
