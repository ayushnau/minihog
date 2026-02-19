# Current Dashboard System – Full Specification

This document lists every feature, page, component, and integration in the current MiniHog dashboard so a new UI can replicate and improve on it.

---

## 1. Tech stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS, dark mode via `dark` class on `<html>`
- **Charts:** Recharts (LineChart, BarChart, PieChart, ResponsiveContainer, etc.)
- **HTTP:** Axios with `withCredentials: true` (cookies for JWT)
- **Auth:** JWT in HTTP-only cookie `auth-token`; checked via `/api/auth/me`

---

## 2. Routes & pages

| Route | Purpose | Auth |
|-------|---------|------|
| `/` | Landing + documentation | Public |
| `/signin` | Sign in / Sign up (toggle) | Public |
| `/dashboard` | Overview (high-level stats + event breakdown) | Protected |
| `/events` | Event analytics (single event, time series, properties, journeys, paths) | Protected |
| `/funnel` | Funnel analysis (multi-step) | Protected |
| `/retention` | Retention analysis (cohort + day N) | Protected |
| `/attribution` | Attribution & campaign analytics | Protected |
| `/keys` | API key management (list, create, revoke) | Protected |
| `/settings` | API URL display, health check, About | Protected |

---

## 3. Authentication

- **Login:** `POST /api/auth/login` — body: `{ username, password }`; sets `auth-token` cookie; redirects to `/dashboard`.
- **Register:** `POST /api/auth/register` — body: `{ username, email, password }`; on success, auto-login then redirect to `/dashboard`.
- **Current user:** `GET /api/auth/me` — returns `{ user: { id, username, email } }` or 401.
- **Logout:** `POST /api/auth/logout` — clears auth; redirect to `/`.
- **AuthGuard:** Wraps protected pages; shows “Loading…”, then either children or LoginModal + “Please sign in” + Sign In button.
- **LoginModal:** Same login/register form as `/signin`; used when visiting protected route unauthenticated; on success calls `onSuccess` and closes.

---

## 4. Global layout & shell

- **Layout:** Root layout has Navigation + `<main>{children}</main>`.
- **Navigation:**
  - **Public (e.g. on `/signin`):** Logo “MiniHog”, Dark mode toggle, and either (username + “Dashboard” link) or “Sign In”.
  - **Protected:** Logo, nav links (Documentation, Overview, Events, Funnel, Retention, Attribution, API Keys, Settings), Dark mode, and either (avatar initial + username + Logout) or “Sign In”. Mobile: hamburger menu with same links + user section.
- **Dark mode:** DarkModeToggle toggles `dark` class on `document.documentElement` and persists in `localStorage` key `darkMode`; respects `prefers-color-scheme: dark` if no stored value.
- **Viewport:** `viewport` export in layout (device-width, initialScale, viewportFit). `overflow-x-hidden` on html/body. Safe-area and `.pb-safe` in globals.css.

---

## 5. Page-by-page features

### 5.1 Landing (`/`)

- **Hero:** Title “MiniHog Analytics”, tagline, short description, “Get Started” → `/signin`.
- **Features:** 4 feature cards (Event Tracking, Real-time Analytics, Attribution, Easy Integration) with icon + title + description.
- **Documentation:** Collapsible-style sections:
  - **Getting Started:** Short description + Quick Start (sign up, generate key, install SDK, track events).
  - **JavaScript SDK:** npm install + `MiniHog.init` + examples (page_view, button_click, signup, purchase).
  - **API Endpoints:** POST /track, POST /click, POST /install with example JSON.
  - **Analytics Queries:** GET /analytics/events, /funnel, /retention, /attribution with query params described.
  - **Attribution Model:** Last-click attribution steps + `ATTRIBUTION_WINDOW_HOURS` mention.
- **CTA:** “Ready to get started?” + “Generate API Key” → `/signin`.

---

### 5.2 Sign In (`/signin`)

- Toggle: “Sign In” vs “Sign Up”.
- **Sign In:** Username, Password; submit → `/api/auth/login`; on success `window.location.href = '/dashboard'`.
- **Sign Up:** Username, Email, Password; submit → `/api/auth/register`; on success same flow as login.
- Error message shown on failure. “← Back to home” link.
- No nav bar links to other app pages (minimal header).

---

### 5.3 Dashboard Overview (`/dashboard`)

- **AuthGuard** wraps content.
- **DateRangePicker:** From/To date inputs, Apply, quick buttons 7d / 30d / 90d; `onDateChange(from, to)`; default last 7 days.
- **KPI cards (3):** Total Events, Unique Users, Event Types (count), in a responsive grid.
- **Event Breakdown:** List of events; for each: event name, “X unique users”, total count. Events fetched for a fixed list: `install`, `signup`, `purchase`, `app_open` (each via `api.getEventCounts(event, from, to)`); failed events ignored; empty state if no events.
- Loading state: “Loading dashboard data…”. Error state: red alert with message.

---

### 5.4 Events (`/events`)

- **AuthGuard.** Page title “Event Analytics”.
- **DateRangePicker** (same as overview).
- **Filters:**
  - Event name (text input, debounced 500ms).
  - Granularity: Daily / Hourly (select).
  - “Load” button (disabled when event name empty).
- **Account overview (optional):** If user exists: Dashboard User (username, email), Data Period (from–to), Event Analyzed (event name); grid layout.
- **Overview cards:** Total Events, Unique End Users (with tooltip), Trend % vs previous period (if time series has enough data).
- **Time series chart:** Line chart (date vs count and unique_users); Recharts LineChart, XAxis angle -45; granularity = day | hour.
- **Properties breakdown (if available):** Dropdown to pick property key; Bar chart + Pie chart by property value; table of top 5: value, count, unique users.
- **Individual user journeys (if available):** List of up to 10 journeys; each: user_id (truncated), total events, list of event chips (event name + optional page).
- **Common user paths (if available):** List of paths; each: Path #N, “X end users (Y%)”, sequence of steps (event names + optional button_id).
- **Empty states:** “No detailed analytics…” when no time series/properties/journeys; “No event data available…” when no data for criteria.
- **API:** `api.getEventCounts(event, from, to, { includeTimeSeries, includeProperties, includeJourneys, propertyKey, granularity })`.

---

### 5.5 Funnel (`/funnel`)

- **AuthGuard.** “Funnel Analysis” title.
- **DateRangePicker.**
- **Input:** “Funnel Steps (comma-separated)” text input (e.g. `install,signup,purchase`); “Analyze” button. Loads on mount when from/to change and when Analyze clicked. Validation: at least 2 steps.
- **Funnel visualization:** Bar chart (horizontal): step name vs users; Recharts BarChart layout vertical.
- **Funnel steps table:** For each step: “Step N: event_name”, drop-off % (except first), user count. Responsive row layout.
- **API:** `api.getFunnelAnalysis(stepArray, from, to)`.

---

### 5.6 Retention (`/retention`)

- **AuthGuard.** “Retention Analysis” title.
- **DateRangePicker.**
- **Inputs:** Cohort event (text, debounced 500ms), Day (number, min 1); data loads when from/to/cohort/day change. Validation: cohort non-empty, day ≥ 1.
- **KPI cards (3):** Cohort Size, Retained Users, Retention Rate %.
- **Retention details:** Cohort Event, Retention Day, Date Range (from–to). Stacked rows.
- **API:** `api.getRetentionAnalysis(cohort, day, from, to)`.

---

### 5.7 Attribution (`/attribution`)

- **AuthGuard.** “Attribution & Campaign Analytics” title.
- **Refresh** button to reload.
- **Two sections:** “Installs by Campaign” and “Purchases by Campaign”; each: Pie chart + list of campaign_id (or “Unattributed”) with install_count or purchase_count. No date range; data is global.
- **API:** `api.getAttributionAnalytics()`.

---

### 5.8 API Keys (`/keys`)

- **AuthGuard.** “API Keys” title.
- **Generate:** Text input (key name), “Generate” button. On success: show one-time key in a green box with copy button and “I’ve copied the key”; key is `break-all` for long strings.
- **List:** “Your API Keys” header; “Revoke All” if any keys exist. Each key: name, “Created &lt;date&gt;”, “Revoke Key” button. Keys loaded via GET; no raw key shown after creation (only in the success box once).
- **API:** GET/POST/DELETE `/api/keys` (dashboard’s Next.js route); POST body `{ name }`; DELETE with `?id=&lt;keyId&gt;` or `?all=true`. JWT from cookie.

---

### 5.9 Settings (`/settings`)

- **AuthGuard.** “Settings” title.
- **API Configuration:** Read-only “API URL” (from `NEXT_PUBLIC_API_URL` or `http://localhost:3000`); helper text “Configure via NEXT_PUBLIC_API_URL”.
- **Connection Status:** Indicator (checking / healthy / error) + “Retry” button. Calls `api.healthCheck()` → GET `/health` (same-origin; may need to align with backend health endpoint).
- **About:** “MiniHog Dashboard”, “Version: 1.0.0”, “Backend API: &lt;url&gt;”.

---

## 6. Shared components

- **DateRangePicker:** From/To date inputs, Apply, 7d/30d/90d; `onDateChange(from, to)`, optional `defaultDays`. Used on Dashboard, Events, Funnel, Retention.
- **AuthGuard:** Fetches `/api/auth/me`; shows loading; if no user, shows LoginModal + “Please sign in” + button to open modal.
- **LoginModal:** Login/Register toggle; form fields; submit to same auth API; `isOpen`, `onClose`, `onSuccess`; body scroll locked when open.
- **Navigation:** Per-route behavior (public vs protected); mobile hamburger; DarkModeToggle; user avatar + username + Logout or Sign In.
- **DarkModeToggle:** Toggle dark class and localStorage.

---

## 7. API layer (frontend)

- **Base:** Axios instance, `baseURL: ''`, `withCredentials: true`. Interceptor maps 4xx/5xx to user-friendly errors via `handleApiError`.
- **Endpoints used:**
  - `GET /api/analytics/events` — params: event, from, to, include_time_series, include_properties, include_journeys, property_key, granularity.
  - `GET /api/analytics/funnel` — params: steps (comma-separated), from, to.
  - `GET /api/analytics/retention` — params: cohort, day, from, to.
  - `GET /api/analytics/attribution` — no params.
  - `GET /health` — health check (same-origin).
- **Next.js API routes** (proxy to backend): Each analytics route reads `auth-token` cookie and forwards `Authorization: Bearer &lt;token&gt;` to `NEXT_PUBLIC_API_URL`:
  - `/api/analytics/events` → `{API_URL}/dashboard/analytics/events`
  - `/api/analytics/funnel` → `{API_URL}/dashboard/analytics/funnel`
  - `/api/analytics/retention` → `{API_URL}/dashboard/analytics/retention`
  - `/api/analytics/attribution` → `{API_URL}/dashboard/analytics/attribution`
- **Keys:** `/api/keys` is implemented in dashboard (JWT from cookie, uses `auth.getUserApiKeys`, `auth.generateApiKey`, etc.; backend DB via `DATABASE_URL`).

---

## 8. Data types (from `api.ts`)

- **EventCountResponse:** event, from, to, total_count, unique_users; optional: time_series (date, count, unique_users), properties_breakdown (value, count, unique_users), available_properties, user_journeys (user_id, events[], total_events), common_paths (path[], path_with_ids[], count, percentage).
- **FunnelResponse:** steps[], from, to, funnel (step, event_name, users, drop_off_percentage), total_users_at_first_step.
- **RetentionResponse:** cohort, day, from, to, cohort_size, retained_users, retention_percentage.
- **AttributionResponse:** installs_by_campaign, purchases_by_campaign (campaign_id, install_count | purchase_count).
- **User:** id, username, email.

---

## 9. Error handling

- **handleApiError:** Maps status (400, 401, 403, 404, 409, 429, 5xx) and optional `data.error` to user-facing strings. Network errors → connection message.
- **safeApiCall:** Wrapper returning `{ data, error }` for optional use.
- Pages show inline error messages (e.g. red alert) and loading states where applicable.

---

## 10. Environment

- **NEXT_PUBLIC_API_URL:** Backend base (e.g. `http://localhost:3000`); used by Next.js API routes and shown in Settings.
- **JWT_SECRET:** Used by dashboard API routes (e.g. keys, auth) for verifying `auth-token` cookie.
- **DATABASE_URL:** Used by dashboard for API keys and auth (e.g. user, api_keys tables).

---

## 11. Checklist for a new UI

When building the new dashboard, ensure:

- [ ] All 9 routes above exist with same auth rules.
- [ ] Auth: login, register, me, logout, AuthGuard, optional LoginModal.
- [ ] Nav: same links and user section; mobile menu or equivalent.
- [ ] Dark mode (or new theme system).
- [ ] DateRangePicker (or equivalent) where used.
- [ ] Dashboard: date range, 3 KPIs, event breakdown for install/signup/purchase/app_open.
- [ ] Events: event name (debounced), granularity, Load; account overview; KPIs; time series line chart; properties (dropdown, bar + pie, top 5 table); user journeys; common paths; empty/error states.
- [ ] Funnel: steps input, Analyze; bar chart; steps table with drop-off.
- [ ] Retention: cohort + day inputs; 3 KPIs; details block.
- [ ] Attribution: refresh; installs + purchases by campaign (pie + list).
- [ ] Keys: generate (name → one-time key + copy); list with revoke per key and revoke all.
- [ ] Settings: API URL (read-only), health check + Retry, About.
- [ ] Landing: hero, features, documentation sections, CTA.
- [ ] Sign-in page: login/register toggle, redirect after success.
- [ ] Same API surface (same Next.js API routes and backend paths) and same data types so only the UI changes.

Use this spec as the single source of truth for “what the current system has” when integrating into the new dashboard.
