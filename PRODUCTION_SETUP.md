# Production Setup Guide - KABS 2D Design Tool

This guide will help you set up the KABS 2D Design Tool for production use with database connectivity and multi-tenant support.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ database
- Git

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **Storage**: Multi-tenant with company isolation

## Setup Instructions

### 1. Database Setup

#### Install PostgreSQL

**Windows:**
```bash
# Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE kab_design_tool;

# Create user (optional)
CREATE USER kab_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE kab_design_tool TO kab_user;

# Exit psql
\q
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your database credentials
# DATABASE_URL=postgresql://username:password@localhost:5432/kab_design_tool
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=kab_design_tool
# DB_USER=postgres
# DB_PASSWORD=your_password
# JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Run database migrations
npm run migrate

# Start development server
npm run dev

# Or build and start production server
npm run build
npm start
```

### 3. Frontend Setup

```bash
# From project root
npm install

# Copy environment file
cp .env.example .env

# Edit .env file
# VITE_API_URL=http://localhost:3001/api

# Start development server
npm run dev

# Build for production
npm run build
```

### 4. Environment Variables

#### Backend (.env)
```env
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/kab_design_tool
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kab_design_tool
DB_USER=postgres
DB_PASSWORD=your_secure_password
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend (.env)
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME=KABS 2D Design Tool
```

## Production Deployment

### Option 1: Traditional Server (VPS/Dedicated)

#### Backend Deployment

1. **Install Node.js and PM2**
```bash
npm install -g pm2
```

2. **Build and Start**
```bash
cd backend
npm run build
pm2 start dist/server.js --name kab-backend
pm2 save
pm2 startup
```

3. **Setup Nginx Reverse Proxy**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Frontend Deployment

1. **Build**
```bash
npm run build
```

2. **Deploy dist folder to Nginx**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/kab-design-tool/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Option 2: Docker Deployment

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: kab_design_tool
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://postgres:your_secure_password@postgres:5432/kab_design_tool
      JWT_SECRET: your-super-secret-jwt-key
      CORS_ORIGIN: http://localhost:5173
    ports:
      - "3001:3001"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

### Option 3: Cloud Platforms

#### Railway / Render / Fly.io

1. Connect your GitHub repository
2. Set environment variables
3. Deploy backend and frontend separately
4. Use managed PostgreSQL service

#### AWS / Google Cloud / Azure

1. Use RDS/Cloud SQL/Azure Database for PostgreSQL
2. Deploy backend to EC2/Cloud Run/App Service
3. Deploy frontend to S3/Cloud Storage/Blob Storage
4. Configure CDN (CloudFront/Cloud CDN/Azure CDN)

## Security Checklist

- [ ] Change JWT_SECRET to a strong random string (min 32 characters)
- [ ] Use HTTPS in production
- [ ] Set secure CORS origins
- [ ] Enable rate limiting
- [ ] Use environment variables for all secrets
- [ ] Regular database backups
- [ ] Keep dependencies updated
- [ ] Use strong database passwords
- [ ] Enable PostgreSQL SSL connections
- [ ] Set up monitoring and logging

## Database Backup

```bash
# Backup
pg_dump -U postgres kab_design_tool > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres kab_design_tool < backup_20240101.sql
```

## Monitoring

### Health Check Endpoint
```
GET /health
```

### Logs
- Backend logs: Check PM2 logs or Docker logs
- Database logs: Check PostgreSQL logs
- Frontend errors: Check browser console

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check connection string in .env
- Verify firewall rules allow connections

### CORS Errors
- Update CORS_ORIGIN in backend .env
- Ensure frontend URL matches exactly

### Authentication Issues
- Verify JWT_SECRET is set
- Check token expiration
- Clear browser localStorage

## Support

For issues or questions, check the logs and verify all environment variables are set correctly.

