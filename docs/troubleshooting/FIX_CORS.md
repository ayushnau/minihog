# Fix CORS for Custom Domain

## Problem
Your dashboard is at `https://minihog.ayushnautiyal.com` but CORS_ORIGIN doesn't include it.

## Solution: Update CORS_ORIGIN in Vercel

### Option 1: Add via Vercel Dashboard (Easiest)

1. Go to Vercel Dashboard → Your API Project → Settings → Environment Variables
2. Find `CORS_ORIGIN`
3. Update value to include both URLs (comma-separated):
   ```
   https://minihog.ayushnautiyal.com,https://your-dashboard.vercel.app
   ```
4. Save and redeploy

### Option 2: Update via Terminal

```bash
cd packages/api

# Remove old CORS_ORIGIN
vercel env rm CORS_ORIGIN production
vercel env rm CORS_ORIGIN preview  
vercel env rm CORS_ORIGIN development

# Add new CORS_ORIGIN with both domains
vercel env add CORS_ORIGIN production
# When prompted, enter: https://minihog.ayushnautiyal.com,https://your-dashboard.vercel.app

vercel env add CORS_ORIGIN preview
# Same value

vercel env add CORS_ORIGIN development
# Enter: http://localhost:3001
```

### Option 3: Multiple Origins (Recommended)

If you have multiple domains:

```bash
cd packages/api

vercel env add CORS_ORIGIN production
# Enter: https://minihog.ayushnautiyal.com,https://your-dashboard.vercel.app,https://www.minihog.ayushnautiyal.com
```

**Important:** Use comma-separated values, NO SPACES around commas.

## After Updating

Redeploy the API:
```bash
cd packages/api
vercel --prod
```

## Test CORS

```bash
curl -H "Origin: https://minihog.ayushnautiyal.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://backendapiserver.vercel.app/dashboard/analytics/events
```

Should return `200 OK` with CORS headers.

