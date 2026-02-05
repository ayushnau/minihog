# Deploy MiniHog with Vercel's Built-in Supabase Integration

This guide uses Vercel's native Supabase integration, which automatically provisions and manages your database.

## Prerequisites

- ✅ Vercel account: [vercel.com](https://vercel.com)
- ✅ Git repository (GitHub recommended)
- ✅ Node.js and npm installed locally

---

## Step 1: Install Vercel CLI

```bash
npm i -g vercel
vercel login
```

---

## Step 2: Deploy API to Vercel (with Supabase Integration)

### 2.1 Initial Deployment

```bash
cd packages/api

# Deploy to Vercel
vercel

# Follow prompts:
# - Set up and deploy? → Yes
# - Which scope? → Select your account
# - Link to existing project? → No
# - Project name? → minihog-api (or your choice)
# - Directory? → ./
# - Override settings? → No
```

### 2.2 Add Supabase Integration

1. Go to your Vercel dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your **minihog-api** project
3. Go to **Settings** → **Integrations**
4. Find **Supabase** and click **Add Integration**
5. Follow the prompts:
   - Create a new Supabase project OR link existing one
   - Vercel will automatically create a Supabase project for you
   - Vercel will automatically add multiple environment variables (see below)

### 2.2.1 Map Prisma Database URL

Vercel provides `POSTGRES_PRISMA_URL` which is optimized for Prisma. You need to map it to `DATABASE_URL`:

1. Go to **Settings** → **Environment Variables**
2. Find `POSTGRES_PRISMA_URL` (it's already there from Supabase integration)
3. Copy its value
4. Add a new environment variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Paste the value from `POSTGRES_PRISMA_URL`
   - **Environments**: Production, Preview, Development (all three)

**Why?** Prisma looks for `DATABASE_URL` by default, but Vercel provides `POSTGRES_PRISMA_URL`. This mapping makes them work together.

### 2.3 Add Other Environment Variables

```bash
cd packages/api

# Add attribution window
vercel env add ATTRIBUTION_WINDOW_HOURS
# Enter: 24
# Select: Production, Preview, Development (all three)
```

### 2.4 Deploy to Production

```bash
vercel --prod
```

**Save your API URL** - Vercel will show you something like:
```
https://minihog-api.vercel.app
```

### 2.5 Run Database Migrations

After Supabase is connected, you need to run migrations:

```bash
# Pull environment variables from Vercel
cd packages/api
vercel env pull .env.local

# This downloads all environment variables including POSTGRES_PRISMA_URL
# Now set DATABASE_URL to use POSTGRES_PRISMA_URL
# Edit .env.local and add:
# DATABASE_URL="${POSTGRES_PRISMA_URL}"

# Or manually copy POSTGRES_PRISMA_URL value to DATABASE_URL in .env.local

# Then run migrations
npx prisma generate
npx prisma migrate deploy

# Or if you prefer db push (faster for initial setup)
npx prisma db push
```

**Note**: After pulling env vars, you'll see `POSTGRES_PRISMA_URL` in `.env.local`. Either:
- Manually copy its value to `DATABASE_URL` in `.env.local`, OR
- Use `export DATABASE_URL=$POSTGRES_PRISMA_URL` before running migrations

---

## Step 3: Deploy Dashboard to Vercel

### 3.1 Initial Deployment

```bash
cd ../dashboard

# Deploy to Vercel
vercel

# Follow prompts:
# - Set up and deploy? → Yes
# - Which scope? → Select your account
# - Link to existing project? → No
# - Project name? → minihog-dashboard (or your choice)
# - Directory? → ./
# - Override settings? → No
```

### 3.2 Add Supabase Integration (Same Database)

1. Go to Vercel dashboard → **minihog-dashboard** project
2. Go to **Settings** → **Integrations**
3. Add **Supabase** integration
4. **Important**: Link to the **same Supabase project** you created for the API
   - Select "Use existing Supabase project"
   - Choose the project from step 2.2
   - This shares the same database between API and Dashboard

### 3.2.1 Map Prisma Database URL

Same as step 2.2.1 - map `POSTGRES_PRISMA_URL` to `DATABASE_URL`:

1. Go to **Settings** → **Environment Variables**
2. Find `POSTGRES_PRISMA_URL`
3. Copy its value
4. Add `DATABASE_URL` with the same value
5. Select all environments (Production, Preview, Development)

### 3.3 Add Other Environment Variables

```bash
cd packages/dashboard

# Generate JWT secret
openssl rand -base64 32

# Add JWT secret
vercel env add JWT_SECRET
# Paste the generated secret
# Select: Production, Preview, Development (all three)

# Add API URL
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://minihog-api.vercel.app (your API URL from step 2.4)
# Select: Production, Preview, Development (all three)
```

### 3.4 Deploy to Production

```bash
vercel --prod
```

---

## Step 4: Run Dashboard Migrations

Since you're using the same database, the API migrations already created the tables. You just need to ensure the dashboard schema is also applied:

```bash
cd packages/dashboard

# Pull environment variables
vercel env pull .env.local

# Generate Prisma client
npx prisma generate

# Push schema (or migrate)
npx prisma db push
# OR
npx prisma migrate deploy
```

**Note**: Since both API and Dashboard use the same database, their schemas will merge automatically. The `User` and `ApiKey` tables from the dashboard schema will be added to the existing database.

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

## Step 6: Access Supabase Dashboard

1. Go to Vercel Dashboard → Your Project → Settings → Integrations
2. Click on the Supabase integration
3. Click **"Open Supabase Dashboard"** to access your database
4. You can:
   - View tables in Table Editor
   - Run SQL queries
   - View connection details
   - Manage your database

---

## Environment Variables Summary

### Vercel Supabase Integration Provides:
- `POSTGRES_PRISMA_URL` - **Use this for Prisma** (optimized connection string)
- `POSTGRES_URL` - Pooled connection
- `POSTGRES_URL_NON_POOLING` - Direct connection
- `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE` - Individual components
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc. - Supabase client variables

### API Project (`packages/api`)
- ✅ `DATABASE_URL` - **Manually set to value of `POSTGRES_PRISMA_URL`** (see step 2.2.1)
- ✅ `ATTRIBUTION_WINDOW_HOURS` - `24` (manual)

### Dashboard Project (`packages/dashboard`)
- ✅ `DATABASE_URL` - **Manually set to value of `POSTGRES_PRISMA_URL`** (see step 3.2.1)
- ✅ `JWT_SECRET` - Random secret (manual)
- ✅ `NEXT_PUBLIC_API_URL` - Your API URL (manual)

---

## Key Differences with Vercel's Built-in Supabase

### Advantages:
- ✅ **Automatic setup**: No manual Supabase account creation needed
- ✅ **Automatic connection**: `DATABASE_URL` is automatically configured
- ✅ **Integrated dashboard**: Access Supabase from Vercel dashboard
- ✅ **Simplified workflow**: Everything in one place

### Important Notes:
1. **Connection String**: Vercel automatically uses the correct connection string (pooled for serverless)
2. **Same Database**: Both API and Dashboard should use the **same Supabase project** to share data
3. **Migrations**: You still need to run Prisma migrations manually after deployment
4. **Access**: You can access Supabase dashboard through Vercel integration

---

## Troubleshooting

### Database Connection Fails

**Problem**: API can't connect to database

**Solutions**:
- ✅ Verify Supabase integration is added in Vercel dashboard
- ✅ Check that `DATABASE_URL` environment variable exists
- ✅ Ensure migrations have been run
- ✅ Check Vercel function logs for specific errors

### Migrations Fail

**Problem**: "Relation does not exist" or migration errors

**Solutions**:
```bash
# Pull environment variables first
vercel env pull .env.local

# Then run migrations
npx prisma generate
npx prisma db push

# Or use migrate
npx prisma migrate deploy
```

### Build Fails on Vercel

**Problem**: Build errors in Vercel dashboard

**Solutions**:
- ✅ Check build logs in Vercel dashboard
- ✅ Ensure Prisma client is generated in build command
- ✅ Verify `DATABASE_URL` is set (should be automatic with integration)
- ✅ Check that all dependencies are in `package.json`

### Dashboard Can't Connect to API

**Problem**: Dashboard shows API errors

**Solutions**:
- ✅ Verify `NEXT_PUBLIC_API_URL` is set correctly
- ✅ Check CORS settings in API
- ✅ Ensure API is deployed and accessible
- ✅ Check browser console for specific errors

---

## Quick Reference Commands

```bash
# Deploy API
cd packages/api
vercel --prod

# Deploy Dashboard
cd packages/dashboard
vercel --prod

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma generate
npx prisma migrate deploy

# View database (Prisma Studio)
npx prisma studio
```

---

## Deployment Checklist

### API Deployment:
- [ ] Deploy to Vercel
- [ ] Add Supabase integration in Vercel dashboard
- [ ] Add `ATTRIBUTION_WINDOW_HOURS` environment variable
- [ ] Deploy to production
- [ ] Run database migrations
- [ ] Test API health endpoint

### Dashboard Deployment:
- [ ] Deploy to Vercel
- [ ] Add Supabase integration (link to same project as API)
- [ ] Add `JWT_SECRET` environment variable
- [ ] Add `NEXT_PUBLIC_API_URL` environment variable
- [ ] Deploy to production
- [ ] Run database migrations (if needed)
- [ ] Test dashboard functionality

---

## Next Steps

- ✅ Set up custom domains in Vercel
- ✅ Configure monitoring and error tracking
- ✅ Set up database backups in Supabase
- ✅ Add environment variable management
- ✅ Set up CI/CD with GitHub Actions

---

## Important Notes

1. **Same Database**: Use the same Supabase project for both API and Dashboard to share data
2. **Automatic Connection**: Vercel handles the connection string automatically - no need to manually configure pooling
3. **Migrations**: Still need to run Prisma migrations after deployment
4. **Access**: Access Supabase through Vercel dashboard → Integrations → Supabase

---

## Support

If you encounter issues:
1. Check Vercel function logs
2. Check Supabase dashboard (via Vercel integration)
3. Verify environment variables are set correctly
4. Test database connection locally using `vercel env pull`

Good luck with your deployment! 🚀

