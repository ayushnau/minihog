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

## Notes

- The dashboard proxies analytics requests to `NEXT_PUBLIC_API_URL` and uses the same DB for auth and API keys.
- For local dev: copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` (and optionally `DATABASE_URL`) for your local API/DB.
