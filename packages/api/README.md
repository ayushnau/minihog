# MiniHog API

Backend API for MiniHog analytics engine.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL
```

3. Run database migrations:
```bash
npm run db:generate
npm run db:migrate
```

4. Start the server:
```bash
npm run dev
```

## API Endpoints

See main README for API documentation.

## Database

Uses Prisma ORM with PostgreSQL. Schema is defined in `prisma/schema.prisma`.

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript
- `npm run db:studio` - Open Prisma Studio
- `npm run db:migrate` - Run database migrations


