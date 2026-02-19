# Vercel deployment (dashboard)

Configure in the Vercel dashboard.

## Project settings

- **Root Directory:** `packages/dashboard`
- **Framework:** Next.js (auto-detected from `vercel.json`)

## Environment variables

**Do this once.** In **Settings → Environment Variables**, add the three variables below. Vercel uses them for every build and at runtime; no need to change them per deploy.  
Production uses the `DATABASE_URL` you set here. Local DB values are not pushed; local dev uses `.env.local` only.

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Base URL of your MiniHog API (must be reachable from the browser) |
| `JWT_SECRET` | Secret for JWT auth cookies (same as the API; use a long random string in production) |
| `DATABASE_URL` | PostgreSQL URL — same DB as the MiniHog API in production (users, api_keys) |

## Keep-warm (serverless cold starts)

On Vercel, **each API route is a separate serverless function**. You do **not** need to warm every API—only the ones that run on the critical path.

- **Must warm:** **`/api/auth/me`** – runs on every app load. **`/api/analytics/events`** – runs when the Events page loads (often the main analytics view). If either is cold, that request takes ~8s.
- **Optional:** **`/api/health`** – lightweight.
- **Don’t warm:** Login, register, keys, profile, other analytics routes (funnel, retention, attribution) unless you see slow first load there too.

So ping **at least** `/api/auth/me` and `/api/analytics/events` every minute (and optionally `/api/health`).

### Option A: Vercel Pro (Cron Jobs)

`vercel.json` defines two crons (health + auth/me), each every minute. No extra setup.

### Option B: Free tier – external cron

Add **three** jobs (e.g. cron-job.org), all every 1 minute:

- `https://your-dashboard.vercel.app/api/health`
- `https://your-dashboard.vercel.app/api/auth/me`
- `https://your-dashboard.vercel.app/api/analytics/events`

At minimum add **`/api/auth/me`** and **`/api/analytics/events`** so app load and the Events page stay fast.

**Events still ~8s?** The dashboard only proxies to your MiniHog API; the 8s is the **backend** cold start. So in addition to the dashboard URLs above, warm the backend: add a cron for **GET `your-api-url/health`** every minute (same as NEXT_PUBLIC_API_URL).
## Notes

- The dashboard proxies analytics requests to `NEXT_PUBLIC_API_URL` and uses the same DB for auth and API keys.
- For local dev: copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` (and optionally `DATABASE_URL`) for your local API/DB.
