# MiniHog Dashboard

Web dashboard for visualizing MiniHog analytics data with authentication and API key management.

## ✨ Features

- **Landing Page** - Public page with product information and SDK documentation
- **Authentication** - Sign up/Sign in with secure password hashing (bcrypt)
- **API Key Management** - Generate and manage API keys for event tracking
- **Overview Dashboard** - Quick summary of events and users
- **Event Analytics** - Detailed event counts with charts
- **Funnel Analysis** - Track user progression through key steps
- **Retention Analysis** - Measure user retention over time
- **Attribution Analytics** - View campaign performance
- **Dark Mode** - Toggle between light and dark themes
- **Settings** - Configure dashboard preferences

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (shared with API package)
- API server running (see `packages/api/README.md`)

### Setup

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
# Database (shared with API)
DATABASE_URL="postgresql://user:password@localhost:5432/minihog"

# JWT secret (must match API's JWT_SECRET)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# API URL (backend API endpoint)
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

3. **Run database migrations:**
```bash
# The API package should have already created the User and ApiKey tables
# Just generate Prisma client for dashboard
npx prisma generate
```

4. **Start development server:**
```bash
npm run dev
```

The dashboard will be available at `http://localhost:3001`

## 🏗️ Architecture

### Next.js App Router

The dashboard uses Next.js 14 with the App Router:

```
src/app/
├── page.tsx              # Landing/Documentation page
├── signin/               # Sign up/Sign in page
├── dashboard/           # Overview dashboard
├── events/               # Event analytics
├── funnel/               # Funnel analysis
├── retention/            # Retention analysis
├── attribution/          # Attribution analytics
├── keys/                 # API key management
├── settings/             # User settings
└── api/                  # Next.js API routes
    ├── auth/             # Authentication endpoints
    ├── keys/             # API key endpoints
    └── analytics/        # Analytics proxy routes
```

### API Route Proxies

The dashboard uses Next.js API routes to proxy requests to the backend API. This solves CORS issues by keeping requests on the same domain:

- `/api/analytics/events` → Proxies to `/dashboard/analytics/events`
- `/api/analytics/funnel` → Proxies to `/dashboard/analytics/funnel`
- `/api/analytics/retention` → Proxies to `/dashboard/analytics/retention`
- `/api/analytics/attribution` → Proxies to `/dashboard/analytics/attribution`

These routes:
1. Extract JWT token from HTTP-only cookie
2. Forward request to backend API with `Authorization: Bearer <token>` header
3. Return response to frontend

This ensures cookies work correctly in cross-origin scenarios.

## 🔐 Authentication Flow

1. User visits landing page (`/`)
2. Clicks "Generate API Key" → redirected to sign in (`/signin`)
3. Signs up or signs in
4. JWT token stored in HTTP-only cookie
5. Redirected to dashboard (`/dashboard`)
6. Can generate API keys in `/keys` page
7. All analytics pages are protected (require authentication)

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Sign in (sets auth cookie)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Sign out (clears cookie)

## 🎨 UI Components

### Core Components

- **Navigation** - Top navigation with auth status and dark mode toggle
- **AuthGuard** - Route protection wrapper
- **LoginModal** - Modal for authentication
- **DarkModeToggle** - Theme switcher
- **DateRangePicker** - Date range selection for analytics
- **DashboardOverview** - Overview cards and charts

### Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Dark Mode** - Automatic theme switching with system preference
- **Responsive Design** - Mobile-friendly layouts

## 📊 Analytics Pages

All analytics pages:
- Require authentication (protected by `AuthGuard`)
- Filter data by user's API keys (data isolation)
- Support date range filtering
- Display empty states gracefully
- Show loading states during data fetch

### Events Page (`/events`)
- Event count over time
- Unique users per event
- Line charts for visualization

### Funnel Page (`/funnel`)
- Step-by-step user progression
- Drop-off percentages
- Funnel visualization

### Retention Page (`/retention`)
- Cohort-based retention
- Retention percentage over time
- Retention heatmap/table

### Attribution Page (`/attribution`)
- Campaign performance
- Installs per campaign
- Revenue per campaign

## 🔑 API Key Management

Users can generate and manage API keys in the `/keys` page:

- **Generate Key** - Creates a new API key
- **View Keys** - List all user's API keys
- **Copy Key** - Easy copy-to-clipboard
- **Last Used** - Track when keys were last used

API keys are:
- Linked to the user who created them
- Used to authenticate event ingestion requests
- Used to filter analytics data (data isolation)

## 🛠️ Development

### Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

### Tech Stack

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Prisma ORM** - Database access
- **bcryptjs** - Password hashing
- **jose** - JWT token handling
- **Axios** - HTTP client

## 🚢 Deployment

### Vercel Deployment

The dashboard is configured for Vercel deployment. See [deployment docs](../../../docs/deployment/) for details.

**Key Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Must match API's JWT_SECRET
- `NEXT_PUBLIC_API_URL` - Backend API URL

### Production Considerations

- ✅ **HTTP-only Cookies** - Secure cookie storage for JWT
- ✅ **CORS Configuration** - Properly configured on API
- ✅ **Error Handling** - User-friendly error messages
- ✅ **Loading States** - Better UX during data fetch
- ✅ **Empty States** - Graceful handling of no data
- ✅ **Type Safety** - Full TypeScript coverage

## 🔒 Security Features

- ✅ **Password Hashing** - bcrypt with 10 rounds
- ✅ **JWT Authentication** - HTTP-only cookies
- ✅ **Input Validation** - Server-side validation
- ✅ **SQL Injection Protection** - Prisma ORM
- ✅ **XSS Protection** - React's built-in escaping
- ✅ **CSRF Protection** - SameSite cookie attribute

## 📚 Related Documentation

- [Main README](../../../README.md)
- [API Package](../api/README.md)
- [Deployment Guide](../../../docs/deployment/)
- [Troubleshooting](../../../docs/troubleshooting/)
