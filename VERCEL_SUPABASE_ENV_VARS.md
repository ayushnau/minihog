# Vercel Supabase Environment Variables Guide

## Understanding Vercel's Supabase Integration Variables

When you add Supabase integration in Vercel, it automatically provides these environment variables:

### Database Connection Variables

| Variable | Purpose | Use For |
|----------|---------|---------|
| `POSTGRES_PRISMA_URL` | **Prisma-optimized connection string** | ✅ **Use this for Prisma** |
| `POSTGRES_URL` | Pooled connection string | General PostgreSQL connections |
| `POSTGRES_URL_NON_POOLING` | Direct connection (no pooling) | Direct database access |
| `POSTGRES_HOST` | Database hostname | Manual connection setup |
| `POSTGRES_USER` | Database username | Manual connection setup |
| `POSTGRES_PASSWORD` | Database password | Manual connection setup |
| `POSTGRES_DATABASE` | Database name | Manual connection setup |

### Supabase Client Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same as anon key (legacy) |
| `SUPABASE_URL` | Internal Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin access) |
| `SUPABASE_JWT_SECRET` | JWT secret for auth |

---

## For Prisma: Use `POSTGRES_PRISMA_URL`

**Important**: Prisma expects `DATABASE_URL` by default, but Vercel provides `POSTGRES_PRISMA_URL`.

### Solution: Map `POSTGRES_PRISMA_URL` to `DATABASE_URL`

#### Option 1: Add `DATABASE_URL` in Vercel Dashboard (Recommended)

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `POSTGRES_PRISMA_URL` and copy its value
3. Click **"Add New"**
4. Add:
   - **Name**: `DATABASE_URL`
   - **Value**: Paste the value from `POSTGRES_PRISMA_URL`
   - **Environments**: Select all (Production, Preview, Development)
5. Save

#### Option 2: Use `POSTGRES_PRISMA_URL` Directly (Requires Code Change)

Update your Prisma schema to use `POSTGRES_PRISMA_URL`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")  // Changed from DATABASE_URL
}
```

**Note**: Option 1 is recommended as it doesn't require code changes.

---

## Local Development Setup

When developing locally, pull environment variables from Vercel:

```bash
# Pull all environment variables
vercel env pull .env.local

# This creates .env.local with all variables including POSTGRES_PRISMA_URL
```

Then in your `.env.local`, add:

```env
# Use POSTGRES_PRISMA_URL for DATABASE_URL
DATABASE_URL="${POSTGRES_PRISMA_URL}"

# Or manually copy the value
# DATABASE_URL="postgresql://postgres:password@host:port/database?pgbouncer=true&connection_limit=1"
```

---

## Running Migrations

After setting up `DATABASE_URL`:

```bash
# Pull environment variables
vercel env pull .env.local

# Set DATABASE_URL from POSTGRES_PRISMA_URL
export DATABASE_URL="${POSTGRES_PRISMA_URL}"

# Or manually copy the value to DATABASE_URL in .env.local

# Run migrations
npx prisma generate
npx prisma migrate deploy
```

---

## Which Connection String to Use?

### For Prisma (Recommended)
- ✅ **`POSTGRES_PRISMA_URL`** - Optimized for Prisma with connection pooling
- This is the one you should use!

### For Direct PostgreSQL Connections
- `POSTGRES_URL` - Pooled connection (good for serverless)
- `POSTGRES_URL_NON_POOLING` - Direct connection (for long-running processes)

### For Supabase Client SDK
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Quick Setup Checklist

- [ ] Add Supabase integration in Vercel
- [ ] Copy `POSTGRES_PRISMA_URL` value
- [ ] Add `DATABASE_URL` environment variable with `POSTGRES_PRISMA_URL` value
- [ ] Pull environment variables locally: `vercel env pull .env.local`
- [ ] Set `DATABASE_URL` in `.env.local` to use `POSTGRES_PRISMA_URL`
- [ ] Run migrations: `npx prisma migrate deploy`

---

## Troubleshooting

### "DATABASE_URL is not set"
- Make sure you've added `DATABASE_URL` in Vercel environment variables
- Verify it's set for the correct environment (Production/Preview/Development)

### "Connection timeout"
- Ensure you're using `POSTGRES_PRISMA_URL` (not `POSTGRES_URL_NON_POOLING`)
- Check that Supabase project is active

### "Authentication failed"
- Verify the connection string is correct
- Check that you copied the full value from `POSTGRES_PRISMA_URL`

---

## Summary

**For MiniHog with Prisma:**
1. Vercel provides `POSTGRES_PRISMA_URL` automatically
2. Map it to `DATABASE_URL` in Vercel environment variables
3. Use `DATABASE_URL` in your Prisma schema (no code changes needed)
4. Run migrations using the mapped `DATABASE_URL`

This keeps your code simple while using the optimized Prisma connection string! 🚀

