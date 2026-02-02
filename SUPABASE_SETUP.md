# Supabase Setup Guide for MiniHog

## Why Supabase?

- ✅ **Free tier**: 500MB database, 2GB bandwidth/month
- ✅ **PostgreSQL**: Industry-standard, powerful database
- ✅ **Easy setup**: Get started in minutes
- ✅ **Connection pooling**: Built-in for serverless (Vercel)
- ✅ **Great performance**: Fast queries and low latency
- ✅ **Vercel integration**: Works seamlessly with Vercel deployments

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: `minihog` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine to start
5. Click "Create new project"
6. Wait 2-3 minutes for project to be ready

## Step 2: Get Database Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **URI** tab
4. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with the password you set when creating the project
6. **Save this connection string** - you'll need it for both API and Dashboard

## Step 3: Run Database Migrations

### Option A: Using Prisma Migrate (Recommended)

```bash
# For API database
cd packages/api
npx prisma migrate dev --name init

# For Dashboard database (if using separate database)
cd ../dashboard
npx prisma migrate dev --name init
```

### Option B: Using Prisma DB Push (Faster for development)

```bash
# For API database
cd packages/api
npx prisma db push

# For Dashboard database
cd ../dashboard
npx prisma db push
```

**Note**: If you're using the same database for both API and Dashboard, you only need to run migrations once. The schemas will merge automatically.

## Step 4: Set Up Connection Pooling (Important for Vercel)

Supabase provides a special connection string for serverless functions that uses connection pooling. This is crucial for Vercel deployments.

1. In Supabase dashboard, go to **Settings** → **Database**
2. Scroll to **Connection pooling**
3. Select **Session mode** (for Prisma)
4. Copy the **Connection string** (it will have a different port, usually 6543)
5. Use this connection string for your Vercel environment variables

**Example connection string format:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true
```

## Step 5: Configure Vercel Environment Variables

### For API Project:

```bash
cd packages/api
vercel env add DATABASE_URL
# Paste your Supabase connection string (with pooling port 6543)
# Select: Production, Preview, Development
```

### For Dashboard Project:

```bash
cd ../dashboard
vercel env add DATABASE_URL
# Paste your Supabase connection string (with pooling port 6543)
# Select: Production, Preview, Development
```

## Step 6: Test Locally

1. Create a `.env` file in `packages/api`:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
   ```

2. Create a `.env` file in `packages/dashboard`:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
   ```

3. Generate Prisma clients:
   ```bash
   cd packages/api && npx prisma generate
   cd ../dashboard && npx prisma generate
   ```

4. Test the connection:
   ```bash
   # In packages/api
   npm run dev
   # Should connect successfully
   ```

## Important Notes

### Connection Pooling

- **For local development**: Use the regular connection string (port 5432)
- **For Vercel deployment**: Use the pooled connection string (port 6543 with `?pgbouncer=true`)

### Database Limits (Free Tier)

- **Database size**: 500MB
- **Bandwidth**: 2GB/month
- **API requests**: Unlimited
- **Concurrent connections**: 60 (pooled)

### Security

- Never commit your database password to Git
- Use environment variables for all sensitive data
- Supabase automatically provides SSL connections

## Troubleshooting

### "Connection timeout" errors
- Make sure you're using the pooled connection string (port 6543) for Vercel
- Check that your Supabase project is active (not paused)

### "Authentication failed" errors
- Verify your password is correct in the connection string
- Make sure you replaced `[YOUR-PASSWORD]` with your actual password

### "Relation does not exist" errors
- Run migrations: `npx prisma migrate deploy`
- Or use: `npx prisma db push`

### Migration issues
- If migrations fail, you can reset: `npx prisma migrate reset` (⚠️ deletes all data)
- For production, use: `npx prisma migrate deploy`

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Run migrations
3. ✅ Configure Vercel environment variables
4. ✅ Deploy to Vercel
5. ✅ Test your deployment

## Alternative: Using Same Database for API and Dashboard

If you want to use a single Supabase database for both API and Dashboard:

1. Use the same `DATABASE_URL` for both projects
2. Run migrations from either package (they'll merge)
3. Both schemas will coexist in the same database

This is recommended for simplicity and cost savings.

