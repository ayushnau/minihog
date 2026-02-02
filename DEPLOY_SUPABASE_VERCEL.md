# Complete Deployment Guide: Supabase + Vercel

This guide will walk you through deploying MiniHog to Vercel with Supabase as your database.

## Prerequisites

- ✅ Vercel account: [vercel.com](https://vercel.com)
- ✅ Supabase account: [supabase.com](https://supabase.com)
- ✅ Git repository (GitHub recommended)
- ✅ Node.js and npm installed locally

---

## Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Name**: `minihog` (or your preferred name)
   - **Database Password**: Choose a strong password ⚠️ **SAVE THIS PASSWORD!**
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine to start
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to be ready

### 1.2 Get Connection Strings

1. In Supabase dashboard, go to **Settings** → **Database**
2. Scroll to **Connection string** section
3. You'll need **TWO** connection strings:

   **For Local Development** (port 5432):
   - Select **URI** tab
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with your actual password
   - Example: `postgresql://postgres:yourpassword@db.xxxxx.supabase.co:5432/postgres`

   **For Vercel Deployment** (port 6543 - with connection pooling):
   - Scroll to **Connection pooling** section
   - Select **Session mode**
   - Copy the connection string (different port: 6543)
   - Replace `[YOUR-PASSWORD]` with your actual password
   - Example: `postgresql://postgres:yourpassword@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true`

### 1.3 Run Database Migrations Locally

```bash
# Set up local environment variable
cd packages/api
echo 'DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"' > .env

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# If you get errors, try:
npx prisma db push
```

**Repeat for dashboard** (if using separate database, or skip if using same DB):

```bash
cd ../dashboard
echo 'DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"' > .env
npx prisma generate
npx prisma migrate dev --name init
```

**Note**: If using the same database for both API and Dashboard, you only need to run migrations once. The schemas will merge automatically.

---

## Step 2: Install Vercel CLI

```bash
npm i -g vercel
vercel login
```

Follow the prompts to authenticate with Vercel.

---

## Step 3: Deploy API to Vercel

### 3.1 Deploy API Project

```bash
cd packages/api

# Initial deployment
vercel

# Follow prompts:
# - Set up and deploy? → Yes
# - Which scope? → Select your account
# - Link to existing project? → No
# - Project name? → minihog-api (or your choice)
# - Directory? → ./
# - Override settings? → No
```

### 3.2 Add Environment Variables

```bash
# Add database URL (use pooled connection for Vercel!)
vercel env add DATABASE_URL
# Paste: postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true
# Select: Production, Preview, Development (all three)

# Add attribution window
vercel env add ATTRIBUTION_WINDOW_HOURS
# Enter: 24
# Select: Production, Preview, Development (all three)
```

### 3.3 Deploy to Production

```bash
vercel --prod
```

**Save your API URL** - Vercel will show you something like:
```
https://minihog-api.vercel.app
```

### 3.4 Run Migrations on Production Database

```bash
# Use the pooled connection string for production
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true"

# Run migrations
npx prisma migrate deploy
```

---

## Step 4: Deploy Dashboard to Vercel

### 4.1 Deploy Dashboard Project

```bash
cd ../dashboard

# Initial deployment
vercel

# Follow prompts:
# - Set up and deploy? → Yes
# - Which scope? → Select your account
# - Link to existing project? → No
# - Project name? → minihog-dashboard (or your choice)
# - Directory? → ./
# - Override settings? → No
```

### 4.2 Add Environment Variables

```bash
# Add database URL (use pooled connection!)
vercel env add DATABASE_URL
# Paste: postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true
# Select: Production, Preview, Development (all three)

# Generate JWT secret
openssl rand -base64 32

# Add JWT secret
vercel env add JWT_SECRET
# Paste the generated secret from above
# Select: Production, Preview, Development (all three)

# Add API URL
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://minihog-api.vercel.app (your API URL from step 3.3)
# Select: Production, Preview, Development (all three)
```

### 4.3 Deploy to Production

```bash
vercel --prod
```

---

## Step 5: Verify Deployment

### 5.1 Test API

```bash
# Health check
curl https://minihog-api.vercel.app/health

# Should return: {"status":"ok","timestamp":"..."}
```

### 5.2 Test Dashboard

1. Visit your dashboard URL (e.g., `https://minihog-dashboard.vercel.app`)
2. Create an account
3. Generate an API key
4. Test the dashboard features

---

## Step 6: Update CORS (If Needed)

If your API and Dashboard are on different domains, update CORS in `packages/api/src/index.ts`:

```typescript
app.use(cors({
  origin: [
    'https://minihog-dashboard.vercel.app',
    'http://localhost:3001' // for local dev
  ],
  credentials: true,
}));
```

Then redeploy:
```bash
cd packages/api
vercel --prod
```

---

## Environment Variables Summary

### API Project (`packages/api`)
- `DATABASE_URL` - Supabase pooled connection (port 6543)
- `ATTRIBUTION_WINDOW_HOURS` - `24`

### Dashboard Project (`packages/dashboard`)
- `DATABASE_URL` - Supabase pooled connection (port 6543)
- `JWT_SECRET` - Random secret (generate with `openssl rand -base64 32`)
- `NEXT_PUBLIC_API_URL` - Your API URL (e.g., `https://minihog-api.vercel.app`)

---

## Troubleshooting

### Database Connection Fails

**Problem**: "Connection timeout" or "Authentication failed"

**Solutions**:
- ✅ Use **pooled connection** (port 6543) for Vercel, not direct connection (port 5432)
- ✅ Verify password is correct in connection string
- ✅ Check Supabase project is active (not paused)
- ✅ Ensure `?pgbouncer=true` is in the connection string

### Migrations Fail

**Problem**: "Relation does not exist" or migration errors

**Solutions**:
```bash
# Try pushing schema directly
npx prisma db push

# Or reset and migrate (⚠️ deletes all data)
npx prisma migrate reset
npx prisma migrate dev
```

### Build Fails on Vercel

**Problem**: Build errors in Vercel dashboard

**Solutions**:
- ✅ Check build logs in Vercel dashboard
- ✅ Ensure Prisma client is generated: `npx prisma generate`
- ✅ Verify all dependencies in `package.json`
- ✅ Check that `DATABASE_URL` is set correctly

### API Returns 404

**Problem**: API routes not found

**Solutions**:
- ✅ Verify `vercel.json` is correct in `packages/api`
- ✅ Check function logs in Vercel dashboard
- ✅ Ensure routes are properly exported in `api/index.ts`

---

## Quick Reference Commands

```bash
# Local development
npm run dev

# Deploy API
cd packages/api
vercel --prod

# Deploy Dashboard
cd packages/dashboard
vercel --prod

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# View database (Prisma Studio)
npx prisma studio
```

---

## Next Steps

- ✅ Set up custom domains in Vercel
- ✅ Configure monitoring and error tracking
- ✅ Set up database backups in Supabase
- ✅ Add environment variable management
- ✅ Set up CI/CD with GitHub Actions

---

## Important Notes

1. **Connection Pooling**: Always use port **6543** with `?pgbouncer=true` for Vercel deployments. This is crucial for serverless functions.

2. **Local vs Production**: Use port **5432** for local development, port **6543** for Vercel.

3. **Same Database**: You can use the same Supabase database for both API and Dashboard. Just run migrations once.

4. **Free Tier Limits**:
   - Supabase: 500MB database, 2GB bandwidth/month
   - Vercel: 100GB bandwidth/month (Hobby plan)

5. **Security**: Never commit `.env` files or connection strings to Git!

---

## Support

If you encounter issues:
1. Check Vercel function logs
2. Check Supabase database logs
3. Verify environment variables are set correctly
4. Test database connection locally first

Good luck with your deployment! 🚀

