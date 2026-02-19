# Deploying the dashboard (Vercel)

Use the same flow as your existing Vercel dashboard project: configure in the Vercel dashboard, then deploy.

## 1. Vercel project settings

1. **Root Directory**  
   Set to **`packages/dashboard2`** (so the Next.js app and its `vercel.json` are used).

2. **Environment Variables** (Settings → Environment Variables)  
   **Do this once.** Set these three variables; Vercel uses them for every build and at runtime. You don’t update them per deploy.  
   Production uses the `DATABASE_URL` you set here (same DB as your API in prod). Local DB values are not pushed; local dev uses `.env.local` only.

   | Variable | Description |
   |----------|-------------|
   | `NEXT_PUBLIC_API_URL` | Base URL of your MiniHog API (e.g. `https://your-api.vercel.app`) |
   | `JWT_SECRET` | Same secret as your API (e.g. `openssl rand -base64 32`) |
   | `DATABASE_URL` | PostgreSQL URL — same DB as the API in production (users, api_keys) |

3. **Build**  
   Leave default or use the app’s `vercel.json`: framework Next.js, build command `npm run build`, output `.next`. No extra step needed.

## 2. Prisma and migrations

- **Why Prisma in dashboard2?**  
  Login, register, profile, and API keys are implemented in the dashboard and talk to the DB. The API only does JWT verification and analytics; it doesn’t expose auth or keys CRUD, so the dashboard needs its own DB access (Prisma).

- **Migrations**  
  If the production DB is already the one used by the API and migrations have been run there, you don’t need to run `prisma migrate deploy` again for dashboard2. Local DB stays local; we don’t push local DB values to production.

## 3. Removing the old dashboard

When you’re fully on dashboard2:

1. Delete **`packages/dashboard/`** (and **`packages/dashboard3/`** if unused).
2. In Vercel, remove or disconnect the old dashboard project. Use the project that has Root Directory = **`packages/dashboard2`** as the dashboard.
3. Update any links or docs to the new dashboard URL.

No changes are needed in root `package.json` or `turbo.json`; workspaces are `packages/*` and turbo will stop building the removed package.
