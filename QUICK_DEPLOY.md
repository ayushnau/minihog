# Quick Deployment Guide to Vercel

## Prerequisites
- Vercel account: https://vercel.com
- PostgreSQL database (Recommended: **Supabase** - free tier available)
  - Alternative: PlanetScale (MySQL), Railway, or AWS RDS
- Git repository (GitHub recommended)

## Step-by-Step Deployment

### 1. Prepare Your Database

**Recommended: Supabase (PostgreSQL)**

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy your connection string (use the **pooled connection** for Vercel - port 6543)
5. Connection string format:
   ```
   postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true
   ```

See `SUPABASE_SETUP.md` for detailed Supabase setup instructions.

### 2. Deploy API First

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Navigate to API
cd packages/api

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Link to existing project? No
# - Project name: minihog-api
# - Directory: ./

# Add environment variables
vercel env add DATABASE_URL
# Paste your PostgreSQL connection string (Supabase recommended)
# Select: Production, Preview, Development

vercel env add ATTRIBUTION_WINDOW_HOURS
# Enter: 24
# Select: Production, Preview, Development

# Deploy to production
vercel --prod
```

**Save your API URL** (e.g., `https://minihog-api.vercel.app`)

### 3. Deploy Dashboard

```bash
# Navigate to Dashboard
cd ../dashboard

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Link to existing project? No
# - Project name: minihog-dashboard
# - Directory: ./

# Add environment variables
vercel env add DATABASE_URL
# Paste your PostgreSQL connection string (Supabase recommended) (same or different DB)
# Select: Production, Preview, Development

vercel env add JWT_SECRET
# Generate a secret: openssl rand -base64 32
# Paste the generated secret
# Select: Production, Preview, Development

vercel env add NEXT_PUBLIC_API_URL
# Enter your API URL from step 2 (e.g., https://minihog-api.vercel.app)
# Select: Production, Preview, Development

# Deploy to production
vercel --prod
```

### 4. Run Database Migrations

Before using the apps, run migrations:

```bash
# For API database
cd packages/api
npx prisma migrate deploy
npx prisma generate

# For Dashboard database
cd ../dashboard
npx prisma migrate deploy
npx prisma generate
```

**Note:** You may need to run migrations locally first, then push to your database.

### 5. Test Your Deployment

1. Visit your dashboard URL
2. Create an account
3. Generate an API key
4. Test the API endpoints

## Alternative: Deploy via GitHub

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. For Dashboard:
   - Root Directory: `packages/dashboard`
   - Framework: Next.js
   - Add environment variables
5. For API:
   - Create new project
   - Root Directory: `packages/api`
   - Framework: Other
   - Add environment variables

## Environment Variables Checklist

### API Project
- ✅ `DATABASE_URL` - PostgreSQL connection string (Supabase recommended)
- ✅ `ATTRIBUTION_WINDOW_HOURS` - 24

### Dashboard Project
- ✅ `DATABASE_URL` - PostgreSQL connection string (Supabase recommended)
- ✅ `JWT_SECRET` - Random secret string
- ✅ `NEXT_PUBLIC_API_URL` - Your API URL

## Troubleshooting

**Build fails?**
- Check Vercel build logs
- Ensure Prisma client is generated
- Verify all dependencies in package.json

**Database connection fails?**
- Verify DATABASE_URL is correct
- For Supabase: Use pooled connection (port 6543) for Vercel
- Check database allows external connections
- For PlanetScale: Enable "Allow connections from anywhere"

**API not working?**
- Check CORS settings
- Verify NEXT_PUBLIC_API_URL is set correctly
- Check function logs in Vercel dashboard

## Next Steps

- Set up custom domains
- Configure monitoring
- Set up database backups
- Enable error tracking (Sentry)


