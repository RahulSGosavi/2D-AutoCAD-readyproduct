# Quick Fix: 500 Internal Server Error

## Problem
The `/api/auth/register` endpoint is returning a 500 error because **PostgreSQL database is not running or not accessible**.

## Solution Steps

### Step 1: Check if PostgreSQL is Running

**Windows:**
```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# If not running, start it:
Start-Service -Name postgresql-x64-14  # (version may vary)
```

**Or check in Services:**
- Press `Win + R`, type `services.msc`
- Look for "postgresql" service
- Right-click → Start (if stopped)

**macOS:**
```bash
brew services list
brew services start postgresql
```

**Linux:**
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE kab_design_tool;

# Exit
\q
```

### Step 3: Update Backend .env File

Create or edit `backend/.env` file:

```env
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kab_design_tool
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# JWT Configuration
JWT_SECRET=kab-design-tool-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important:** Replace `your_postgres_password_here` with your actual PostgreSQL password.

### Step 4: Run Database Migrations

```bash
cd backend
npm run migrate
```

You should see:
```
🔄 Running database migrations...
✅ Database migrations completed successfully
```

### Step 5: Restart Backend Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
cd backend
npm run dev
```

### Step 6: Test Registration Again

Try registering again at http://localhost:5173

## Alternative: Run Without Database (LocalStorage Mode)

If you don't want to set up PostgreSQL right now, you can run the frontend in localStorage mode:

1. **Stop the backend server**
2. **Frontend will automatically fall back to localStorage**
3. **No authentication required** (but no cloud features)

## Common Issues

### Issue: "password authentication failed"
- **Fix:** Check your PostgreSQL password in `.env` file
- Default PostgreSQL password is often `postgres` or empty

### Issue: "database does not exist"
- **Fix:** Create the database: `CREATE DATABASE kab_design_tool;`

### Issue: "relation does not exist"
- **Fix:** Run migrations: `cd backend && npm run migrate`

### Issue: PostgreSQL not installed
- **Download:** https://www.postgresql.org/download/
- **Windows:** Use the installer, remember the password you set
- **macOS:** `brew install postgresql`
- **Linux:** `sudo apt-get install postgresql postgresql-contrib`

## Verify Database Connection

Test if you can connect:

```bash
psql -U postgres -d kab_design_tool
```

If this works, your database is accessible.

## Still Having Issues?

1. Check backend console for detailed error messages
2. Verify PostgreSQL is running: `pg_isready` or check Services
3. Check firewall isn't blocking port 5432
4. Verify `.env` file exists in `backend/` folder
5. Check database credentials match your PostgreSQL setup

