# Setup Guide

## Step-by-Step Setup Instructions

### 1. Install Dependencies

From the root directory:

```bash
npm install
```

### 2. Set Up MySQL Database

Create a MySQL database. Choose one of these methods:

**Option 1: Using MySQL command line (recommended)**
```bash
mysql -u root -p -e "CREATE DATABASE minihog;"
```

**Option 2: Interactive MySQL**
```bash
mysql -u root -p
# Then in the MySQL prompt:
CREATE DATABASE minihog;
EXIT;
```

**Option 3: Using MySQL Workbench or phpMyAdmin**
- Open your MySQL client tool
- Create a new database named `minihog`
- Use UTF8MB4 character set (recommended)

**Option 4: Using Docker (if MySQL is in a container)**
```bash
docker exec -it <mysql-container-name> mysql -u root -p -e "CREATE DATABASE minihog;"
```

### 3. Configure Environment Variables

Navigate to the API package and set up environment:

```bash
cd packages/api
cp .env.example .env
```

Edit `packages/api/.env`:

```env
DATABASE_URL="mysql://your_user:your_password@localhost:3306/minihog"
PORT=3000
NODE_ENV=development
ATTRIBUTION_WINDOW_HOURS=24
```

*Note: Replace `your_user` and `your_password` with your MySQL credentials. Default MySQL port is 3306.*

### 4. Run Database Migrations

```bash
# Generate Prisma client
npm run db:generate

# Run migrations to create tables
npm run db:migrate
```

### 5. Build All Packages

From the root directory:

```bash
npm run build
```

### 6. Start the Development Server

From the root directory:

```bash
npm run dev
```

Or from the API package:

```bash
cd packages/api
npm run dev
```

The API will be available at `http://localhost:3000`

### 7. Verify Installation

Test the health endpoint:

```bash
curl http://localhost:3000/health
```

You should see:

```json
{"status":"ok","timestamp":"2026-01-15T10:30:00.000Z"}
```

## Next Steps

- See `README.md` for API documentation
- Check `examples/` for usage examples
- Use Prisma Studio to explore the database: `cd packages/api && npm run db:studio`

## Troubleshooting

### Database Connection Issues

- Verify MySQL is running: `mysqladmin ping` or check your MySQL service status
- Check your `DATABASE_URL` in `.env` (format: `mysql://user:password@host:port/database`)
- Ensure the database exists: `mysql -u root -p -e "SHOW DATABASES;" | grep minihog`
- Verify MySQL user has proper permissions: `GRANT ALL PRIVILEGES ON minihog.* TO 'your_user'@'localhost';`

### Port Already in Use

Change the `PORT` in `packages/api/.env` or kill the process using port 3000:

```bash
lsof -ti:3000 | xargs kill
```

### Prisma Client Not Generated

Run:

```bash
cd packages/api
npm run db:generate
```

