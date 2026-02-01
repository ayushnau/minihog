# MiniHog Dashboard

Web dashboard for visualizing MiniHog analytics data with authentication and API key management.

## Features

- **Landing Page** - Public page to learn about MiniHog
- **Authentication** - Sign up/Sign in with secure password hashing (bcrypt)
- **API Key Management** - Generate and manage API keys
- **Overview Dashboard** - Quick summary of events and users
- **Event Analytics** - Detailed event counts and visualizations
- **Funnel Analysis** - Track user progression through key steps
- **Retention Analysis** - Measure user retention over time
- **Attribution Analytics** - View campaign performance
- **Dark Mode** - Toggle between light and dark themes
- **Settings** - Configure API connection

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL=mysql://root:ayushayush@localhost:3306/minihog
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXT_PUBLIC_API_URL=http://localhost:3000
```

3. **Run database migrations:**
```bash
# First, ensure the API package has run migrations to create User and ApiKey tables
cd ../api
npm run db:push

# Then generate Prisma client for dashboard
cd ../dashboard
npm run db:generate
```

4. **Run development server:**
```bash
npm run dev
```

The dashboard will be available at `http://localhost:3001`

## Production-Grade Features

- ✅ **Prisma ORM** - Type-safe database access
- ✅ **bcrypt** - Secure password hashing (10 rounds)
- ✅ **JWT Authentication** - HTTP-only cookies for security
- ✅ **Input Validation** - Username, email, password validation
- ✅ **Error Handling** - Comprehensive error messages
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Scalable** - Ready for production deployment

## Tech Stack

- Next.js 14 (App Router)
- React 18
- Prisma ORM
- MySQL Database
- Tailwind CSS
- Recharts for visualizations
- bcryptjs for password hashing
- JWT (jose) for authentication

## Authentication Flow

1. User visits landing page
2. Clicks "Generate API Key" → redirected to sign in
3. Signs up or signs in
4. Redirected to dashboard
5. Can generate API keys in `/keys` page
6. All analytics pages are protected (require authentication)
