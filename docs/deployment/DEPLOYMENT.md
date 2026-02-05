# Deployment Guide for MiniHog

This guide will help you deploy the MiniHog dashboard and API to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Vercel CLI installed: `npm i -g vercel`
3. MySQL database (you can use a service like PlanetScale, Railway, or AWS RDS)
4. Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Strategy

We'll deploy the dashboard and API as **separate Vercel projects** for better isolation and scaling.

### Option 1: Deploy Dashboard and API Separately (Recommended)

This is the recommended approach as it allows independent scaling and easier management.

#### Step 1: Prepare Your Database

1. Set up a MySQL database (e.g., PlanetScale, Railway, or AWS RDS)
2. Get your database connection string (format: `mysql://user:password@host:port/database`)
3. Run migrations:
   ```bash
   # For API database
   cd packages/api
   npx prisma migrate deploy
   npx prisma generate
   
   # For Dashboard database (if using separate database)
   cd ../dashboard
   npx prisma migrate deploy
   npx prisma generate
   ```

#### Step 2: Deploy the API

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Navigate to API directory**:
   ```bash
   cd packages/api
   ```

4. **Deploy API**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? (select your account)
   - Link to existing project? **No** (first time)
   - Project name? **minihog-api** (or your preferred name)
   - Directory? **./** (current directory)
   - Override settings? **No**

5. **Set Environment Variables**:
   ```bash
   vercel env add DATABASE_URL
   # Paste your MySQL connection string when prompted
   # Select: Production, Preview, and Development
   
   vercel env add ATTRIBUTION_WINDOW_HOURS
   # Enter: 24
   # Select: Production, Preview, and Development
   ```

6. **Redeploy with environment variables**:
   ```bash
   vercel --prod
   ```

7. **Note your API URL**: After deployment, Vercel will give you a URL like `https://minihog-api.vercel.app`. Save this URL.

#### Step 3: Deploy the Dashboard

1. **Navigate to Dashboard directory**:
   ```bash
   cd ../dashboard
   ```

2. **Deploy Dashboard**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? (select your account)
   - Link to existing project? **No**
   - Project name? **minihog-dashboard** (or your preferred name)
   - Directory? **./** (current directory)
   - Override settings? **No**

3. **Set Environment Variables**:
   ```bash
   vercel env add DATABASE_URL
   # Paste your MySQL connection string (can be same or different database)
   # Select: Production, Preview, and Development
   
   vercel env add JWT_SECRET
   # Enter a strong random secret (e.g., generate with: openssl rand -base64 32)
   # Select: Production, Preview, and Development
   
   vercel env add NEXT_PUBLIC_API_URL
   # Enter your API URL from Step 2 (e.g., https://minihog-api.vercel.app)
   # Select: Production, Preview, and Development
   ```

4. **Redeploy with environment variables**:
   ```bash
   vercel --prod
   ```

#### Step 4: Update API CORS (if needed)

If your API and dashboard are on different domains, update CORS in `packages/api/src/index.ts`:

```typescript
app.use(cors({
  origin: [
    'https://minihog-dashboard.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
}));
```

### Option 2: Deploy via GitHub Integration (Easier)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Import Dashboard to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - **Root Directory**: Set to `packages/dashboard`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `cd ../.. && npm install && cd packages/dashboard && npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `cd ../.. && npm install`
   - Add environment variables (same as Step 3 above)
   - Deploy!

3. **Import API to Vercel**:
   - Create a new project in Vercel
   - Import the same GitHub repository
   - **Root Directory**: Set to `packages/api`
   - **Framework Preset**: Other
   - **Build Command**: `cd ../.. && npm install && cd packages/api && npm run build && npx prisma generate`
   - **Output Directory**: `dist`
   - Add environment variables (same as Step 2 above)
   - Deploy!

## Environment Variables Summary

### API Project
- `DATABASE_URL`: MySQL connection string
- `ATTRIBUTION_WINDOW_HOURS`: Attribution window in hours (default: 24)

### Dashboard Project
- `DATABASE_URL`: MySQL connection string (for user/auth data)
- `JWT_SECRET`: Secret key for JWT tokens (generate a strong random string)
- `NEXT_PUBLIC_API_URL`: Your API URL (e.g., `https://minihog-api.vercel.app`)

## Post-Deployment

1. **Test your deployment**:
   - Visit your dashboard URL
   - Create an account
   - Generate an API key
   - Test the API endpoints

2. **Set up custom domains** (optional):
   - In Vercel dashboard, go to your project
   - Settings → Domains
   - Add your custom domain

3. **Monitor your deployments**:
   - Check Vercel dashboard for build logs
   - Monitor function logs for errors
   - Set up error tracking (e.g., Sentry)

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure Prisma client is generated before build
- Check build logs in Vercel dashboard

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Check that your database allows connections from Vercel IPs
- For PlanetScale: Enable "Allow connections from anywhere"

### API Not Responding
- Check that API routes are configured correctly in `vercel.json`
- Verify CORS settings allow your dashboard domain
- Check function logs in Vercel dashboard

### Environment Variables Not Working
- Ensure variables are set for the correct environment (Production/Preview/Development)
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)

## Next Steps

- Set up CI/CD with GitHub Actions
- Configure custom domains
- Set up monitoring and error tracking
- Optimize database queries for production
- Set up database backups


