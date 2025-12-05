# Deployment Guide: Hand Game Tracker

This guide will help you deploy the Hand Game Tracker to production with MongoDB.

## Prerequisites

1. **MongoDB Database**
   - MongoDB Atlas account (free tier available) OR
   - Self-hosted MongoDB instance

2. **Hosting Platform** (choose one):
   - **Vercel** (recommended for frontend)
   - **Render** or **Railway** (recommended for backend)
   - Netlify (frontend)
   - DigitalOcean App Platform

3. **Node.js 18+** installed locally

## Step 1: Set Up MongoDB

### Option A: MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free M0 tier works)
4. Create a database user:
   - Database Access → Add New Database User
   - Username: `game-record-user` (or your choice)
   - Password: (generate secure password, **note it down**)
5. Whitelist IP addresses:
   - Network Access → Add IP Address
   - Add `0.0.0.0/0` for all IPs (or your server IPs)
6. Get connection string:
   - Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Format: `mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/game-record?retryWrites=true&w=majority`

### Option B: Self-Hosted MongoDB

Install MongoDB locally or on a server, then use:
```
mongodb://localhost:27017/game-record
```

## Step 2: Test MongoDB Connection Locally

Before deploying, test your MongoDB connection:

```bash
cd server
npm install
npm run test:mongo
```

This will:
- Load your `.env` file
- Connect to MongoDB
- Test read/write operations
- Verify database access

**Expected output:**
```
✅ Connected to MongoDB successfully
✅ Ping successful
✅ Database "game-record" accessible
✅ Write test successful
✅ Read test successful
🎉 All tests passed!
```

If this fails, check:
- MongoDB URI is correct
- Password is URL-encoded (special characters)
- IP is whitelisted in MongoDB Atlas
- Database user has proper permissions

## Step 3: Set Up Backend Server

### Local Development

1. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env  # If .env.example exists
   # Or create .env manually
   ```

3. **Edit `server/.env` file:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/game-record?retryWrites=true&w=majority
   DB_NAME=game-record
   PORT=5201
   FRONTEND_URL=http://localhost:5200
   ```

   **Important:** If your password contains special characters, they will be automatically URL-encoded by the server.

4. **Test the connection:**
   ```bash
   npm run test:mongo
   ```

5. **Run development server:**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   ✅ Connected to MongoDB successfully
   🚀 Server running on http://localhost:5201
   ```

6. **Test the API:**
   ```bash
   curl http://localhost:5201/health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "db": "connected",
     "timestamp": "2024-..."
   }
   ```

### Production Deployment

#### Option 1: Render (Recommended for Backend)

1. Go to [Render](https://render.com)
2. Sign up / Log in
3. New → Web Service
4. Connect your GitHub repository
5. Configure:
   - **Name:** `hand-game-tracker-api` (or your choice)
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
6. **Environment Variables:**
   - `MONGODB_URI` = your MongoDB connection string
   - `DB_NAME` = `game-record`
   - `PORT` = `5200` (Render auto-assigns, but set for consistency)
   - `FRONTEND_URL` = your frontend URL (e.g., `https://your-app.vercel.app`)
7. Click "Create Web Service"
8. Wait for deployment to complete
9. Note your backend URL (e.g., `https://hand-game-tracker-api.onrender.com`)

#### Option 2: Railway (Alternative)

1. Go to [Railway](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repository
4. Add service → Select `server` directory
5. Add environment variables:
   - `MONGODB_URI`
   - `DB_NAME=game-record`
   - `PORT=5200`
   - `FRONTEND_URL`
6. Railway will auto-deploy
7. Note your backend URL

#### Option 3: DigitalOcean App Platform

1. Create new App
2. Connect GitHub
3. Add backend service:
   - Source: `server/` directory
   - Build: `npm install && npm run build`
   - Run: `npm start`
4. Add environment variables
5. Deploy

## Step 4: Deploy Frontend to Vercel

### Prerequisites

1. Backend must be deployed and accessible
2. Note your backend URL (e.g., `https://your-backend.onrender.com`)

### Deployment Steps

1. **Install Vercel CLI (optional):**
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Vercel Dashboard (Recommended):**
   - Go to [Vercel](https://vercel.com)
   - Sign up / Log in
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset:** Vite
     - **Root Directory:** `./` (project root)
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
   - **Environment Variables:**
     - `VITE_API_URL` = `https://your-backend.onrender.com/api`
     - `VITE_USER_ID` = `default` (optional, for multi-user support)
   - Click "Deploy"
   - Wait for deployment to complete
   - Note your frontend URL (e.g., `https://your-app.vercel.app`)

3. **Update Backend CORS:**
   - Go back to your backend hosting (Render/Railway)
   - Update `FRONTEND_URL` environment variable to your Vercel URL
   - Redeploy backend (or it will auto-redeploy)

4. **Verify Deployment:**
   ```bash
   # Set your API URL
   export VITE_API_URL=https://your-backend.onrender.com/api
   
   # Run verification script
   npm run verify:deployment
   ```

   Expected output:
   ```
   ✅ Health Check Endpoint: PASS
   ✅ App Data Endpoint: PASS
   ✅ Database: CONNECTED
   🎉 All checks passed!
   ```

## Step 5: Update Frontend Environment Variables

The frontend automatically uses MongoDB when `VITE_API_URL` is set.

**For local development:**
Create `.env` in project root:
```env
VITE_API_URL=http://localhost:5201/api
VITE_USER_ID=default
```

**For production (Vercel):**
Set in Vercel Dashboard → Project → Settings → Environment Variables:
- `VITE_API_URL` = `https://your-backend.onrender.com/api`
- `VITE_USER_ID` = `default` (optional)

## Step 6: Migration from localStorage

If you have existing data in localStorage:

1. **Export from localStorage:**
   - Open browser DevTools → Application → Local Storage
   - Copy the value of `game-record-data`
   - Save to a file

2. **Import to MongoDB:**
   - Use the backend API:
   ```bash
   curl -X PUT https://your-backend.onrender.com/api/app-data \
     -H "Content-Type: application/json" \
     -d '{"userId":"default","data":{YOUR_DATA_HERE}}'
   ```
   - Or use MongoDB Compass to import directly

## Environment Variables Summary

### Backend (`server/.env` or hosting platform)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/game-record?retryWrites=true&w=majority
DB_NAME=game-record
PORT=5200
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (`.env` or Vercel Dashboard)
```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_USER_ID=default
```

## Testing

### Local Testing

1. **Test MongoDB connection:**
   ```bash
   cd server
   npm run test:mongo
   ```

2. **Test backend API:**
   ```bash
   curl http://localhost:5201/health
   curl http://localhost:5201/api/app-data?userId=test
   ```

3. **Test frontend:**
   - Open browser to `http://localhost:5200`
   - Check console for "✅ Loaded app data from MongoDB"
   - Add players/games and verify they persist

### Production Testing

1. **Test backend health:**
   ```bash
   curl https://your-backend.onrender.com/health
   ```

2. **Run verification script:**
   ```bash
   export VITE_API_URL=https://your-backend.onrender.com/api
   npm run verify:deployment
   ```

3. **Test frontend:**
   - Open your Vercel URL
   - Check browser console for errors
   - Verify data saves/loads correctly

## Troubleshooting

### Backend Issues

- **"db: disconnected" in health check:**
  - Check MongoDB URI is correct
  - Verify password is correct (may need URL encoding)
  - Check IP whitelist in MongoDB Atlas
  - Review server logs for connection errors

- **CORS errors:**
  - Ensure `FRONTEND_URL` is set correctly in backend
  - Verify frontend URL matches exactly (including https/http)
  - Check backend CORS middleware is enabled

- **Connection refused:**
  - Verify MongoDB URI format
  - Check network access settings
  - Ensure database user has proper permissions

### Frontend Issues

- **"Failed to load app data":**
  - Check `VITE_API_URL` is set correctly
  - Verify backend is running and accessible
  - Check browser console for CORS errors
  - Verify backend health endpoint works

- **Data not saving:**
  - Check backend logs
  - Verify MongoDB connection is active
  - Check network tab in browser DevTools

- **Environment variables not working:**
  - Restart dev server after adding `.env`
  - For Vercel: Redeploy after adding env vars
  - Verify variable names start with `VITE_` for Vite

## Production Checklist

- [ ] MongoDB database created and accessible
- [ ] MongoDB connection tested locally (`npm run test:mongo`)
- [ ] Backend deployed and accessible
- [ ] Backend health check returns `"db": "connected"`
- [ ] Environment variables set in both frontend and backend
- [ ] Frontend `VITE_API_URL` points to backend
- [ ] Backend `FRONTEND_URL` points to frontend
- [ ] CORS configured correctly
- [ ] Data migrated from localStorage (if applicable)
- [ ] Tested save/load functionality in production
- [ ] SSL/HTTPS enabled (automatic on Vercel/Render)
- [ ] Verification script passes (`npm run verify:deployment`)

## Quick Reference

### Backend Commands
```bash
cd server
npm install              # Install dependencies
npm run test:mongo      # Test MongoDB connection
npm run dev             # Start dev server
npm run build           # Build for production
npm start               # Start production server
```

### Frontend Commands
```bash
npm install             # Install dependencies
npm run dev             # Start dev server
npm run build           # Build for production
npm run verify:deployment  # Verify deployment
```

### API Endpoints
- `GET /health` - Health check (returns db status)
- `GET /api/app-data?userId=default` - Load app data
- `PUT /api/app-data` - Save app data

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Run `npm run test:mongo` to verify MongoDB connection
3. Run `npm run verify:deployment` to test API endpoints
4. Review this guide's troubleshooting section
5. Check MongoDB Atlas dashboard for connection issues
