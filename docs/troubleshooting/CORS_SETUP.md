# CORS Configuration Guide

## Problem
When using `credentials: true` in CORS (required for sending cookies/JWT tokens), you **cannot** use `origin: '*'`. You must specify the exact origin(s) of your dashboard.

## Solution: Set `CORS_ORIGIN` Environment Variable

### For Local Development

Create a `.env` file in `packages/api/`:

```bash
# packages/api/.env
CORS_ORIGIN=http://localhost:3001
```

**Note:** Replace `3001` with the port your dashboard runs on (check your dashboard's `package.json` or Next.js config).

### For Production (Vercel)

#### Option 1: Single Dashboard URL

In your Vercel API project settings, add:

```bash
CORS_ORIGIN=https://your-dashboard.vercel.app
```

#### Option 2: Multiple Origins (Dashboard + Custom Domain)

```bash
CORS_ORIGIN=https://your-dashboard.vercel.app,https://your-custom-domain.com
```

**Important:** Use comma-separated values (no spaces around commas).

### How to Set in Vercel

1. Go to your API project in Vercel dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name:** `CORS_ORIGIN`
   - **Value:** Your dashboard URL(s)
   - **Environment:** Select all (Production, Preview, Development)
4. **Redeploy** your API:
   ```bash
   cd packages/api
   vercel --prod
   ```

## Quick Check

### Local Development
```bash
# In packages/api/.env
CORS_ORIGIN=http://localhost:3001

# In packages/dashboard/.env.local (if needed)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Production
```bash
# API Vercel Environment Variables
CORS_ORIGIN=https://your-dashboard.vercel.app

# Dashboard Vercel Environment Variables  
NEXT_PUBLIC_API_URL=https://your-api.vercel.app
```

## Troubleshooting

### Still getting CORS errors?

1. **Check the exact error in browser console:**
   - Look for the "Access-Control-Allow-Origin" error
   - Note which origin is being blocked

2. **Verify CORS_ORIGIN matches exactly:**
   - Must include protocol (`http://` or `https://`)
   - Must include port if not 80/443
   - No trailing slash
   - Case-sensitive

3. **Check both API and Dashboard URLs:**
   - API: `https://your-api.vercel.app`
   - Dashboard: `https://your-dashboard.vercel.app`
   - CORS_ORIGIN should match dashboard URL exactly

4. **Redeploy after changing environment variables:**
   ```bash
   cd packages/api
   vercel --prod
   ```

5. **For local development, ensure:**
   - API runs on one port (e.g., 3000)
   - Dashboard runs on another port (e.g., 3001)
   - CORS_ORIGIN points to dashboard port

## Example Configuration

### Local Development
```bash
# packages/api/.env
CORS_ORIGIN=http://localhost:3001
DATABASE_URL=postgresql://...
```

### Production
```bash
# Vercel API Environment Variables
CORS_ORIGIN=https://minihog-dashboard.vercel.app
DATABASE_URL=postgresql://...

# Vercel Dashboard Environment Variables
NEXT_PUBLIC_API_URL=https://minihog-api.vercel.app
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-here
```

## Testing

After setting CORS_ORIGIN:

1. **Clear browser cache** (or use incognito)
2. **Check browser console** - CORS errors should be gone
3. **Verify cookies are sent** - Check Network tab → Request Headers → should see `Cookie: auth-token=...`

