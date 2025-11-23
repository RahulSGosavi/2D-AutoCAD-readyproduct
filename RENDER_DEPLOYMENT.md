# Render Deployment Guide

This guide will help you deploy the KAB 2D Design Tool to Render.

## Repository
- **GitHub**: https://github.com/RahulSGosavi/2D-AutoCAD-readyproduct.git

## Architecture

This application consists of two services:

1. **Frontend** (React + Vite)
2. **Backend** (Node.js + Express + PostgreSQL)

## Deployment Steps

### 1. Backend Service (Web Service)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `RahulSGosavi/2D-AutoCAD-readyproduct`
4. Configure the service:
   - **Name**: `kab-backend` (or your preferred name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free or Starter (depending on your needs)

5. **Environment Variables** (Add in Render Dashboard):
   ```
   PORT=3001
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres:oUYxwmuAv66U9bw7@db.ehbrtcvtelsvsphvairj.supabase.co:5432/postgres
   JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   ```

6. Click **"Create Web Service"**

### 2. Frontend Service (Static Site)

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect your GitHub repository: `RahulSGosavi/2D-AutoCAD-readyproduct`
3. Configure the service:
   - **Name**: `kab-frontend` (or your preferred name)
   - **Root Directory**: `.` (root)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Environment Variables** (Add in Render Dashboard):
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

5. Click **"Create Static Site"**

### 3. Update Frontend API URL

After deploying the backend, update the frontend environment variable:

1. Go to your Frontend service in Render
2. Update `VITE_API_URL` to your backend URL (e.g., `https://kab-backend.onrender.com`)

### 4. Update Backend CORS

After deploying the frontend, update the backend CORS origin:

1. Go to your Backend service in Render
2. Update `CORS_ORIGIN` to your frontend URL (e.g., `https://kab-frontend.onrender.com`)

## Database Setup

The application uses Supabase PostgreSQL. Make sure:

1. Your Supabase database is accessible from Render
2. The `DATABASE_URL` environment variable is correctly set
3. Run migrations on first deployment:
   - In Render, you can add a build command: `npm run migrate` (if needed)

## Important Notes

### Security
- **Change `JWT_SECRET`** to a strong, random string (minimum 32 characters)
- Never commit `.env` files to Git (already in `.gitignore`)
- Use Render's environment variables for all secrets

### CORS Configuration
- Update `CORS_ORIGIN` in backend to match your frontend URL
- For development, you can use `*` (not recommended for production)

### Database Migrations
- The database schema is in `backend/src/db/schema.sql`
- Migrations can be run manually or added to the build process

## Testing Deployment

1. **Backend Health Check**: 
   - Visit: `https://your-backend-url.onrender.com/api/health`
   - Should return: `{ status: 'ok', database: 'connected' }`

2. **Frontend**:
   - Visit your frontend URL
   - Try registering a new user
   - Create a project
   - Test drawing functionality

## Troubleshooting

### Backend Issues
- Check Render logs for errors
- Verify environment variables are set correctly
- Ensure database connection string is valid
- Check that port matches Render's requirements

### Frontend Issues
- Verify `VITE_API_URL` points to correct backend URL
- Check browser console for CORS errors
- Ensure build completed successfully

### Database Issues
- Verify Supabase database is accessible
- Check connection string format
- Ensure database tables exist (run migrations if needed)

## Render URLs

After deployment, you'll get URLs like:
- Backend: `https://kab-backend.onrender.com`
- Frontend: `https://kab-frontend.onrender.com`

Update the environment variables accordingly!

## Support

For issues or questions, check:
- Render Documentation: https://render.com/docs
- Application Logs in Render Dashboard
- GitHub Issues: https://github.com/RahulSGosavi/2D-AutoCAD-readyproduct/issues

