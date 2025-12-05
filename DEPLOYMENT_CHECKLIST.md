# 🚀 Complete Deployment Checklist

## ✅ Pre-Deployment Validation

All validation tests passed:
- ✅ Frontend builds successfully (`npm run build`)
- ✅ Backend builds successfully (`cd server && npm run build`)
- ✅ MongoDB connection test passes (`cd server && npm run test:mongo`)
- ✅ All dependencies installed
- ✅ Git repository initialized

---

## 📦 Step 1: Push to GitHub

### Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Repository name: `game-record`
3. Description: "Hand Game Tracker - Card game results tracker with MongoDB"
4. Choose: Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

### Connect and Push

```bash
cd /Users/alaeadeh/game-record

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/game-record.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

**Expected output:**
```
Enumerating objects: 59, done.
Counting objects: 100% (59/59), done.
Writing objects: 100% (59/59), done.
To https://github.com/YOUR_USERNAME/game-record.git
 * [new branch]      main -> main
```

---

## 🔧 Step 2: Deploy Backend to Render

### Render Configuration

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account (if not already)
4. Select repository: `game-record`
5. Configure service:

   **Basic Settings:**
   - **Name:** `hand-game-tracker-api` (or your choice)
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Root Directory:** `server` ⚠️ **IMPORTANT**
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

   **Environment Variables:**
   ```
   MONGODB_URI=mongodb+srv://alaneadeh_db_user:2Xl1dIbKSwPQAAML@handgame-cluster.r7vrrl.mongodb.net/game-record?retryWrites=true&w=majority&appName=handgame-cluster
   DB_NAME=game-record
   PORT=5200
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
   ⚠️ **Note:** Set `FRONTEND_URL` after Vercel deployment (use placeholder for now)

6. Click **"Create Web Service"**
7. Wait for deployment (2-5 minutes)
8. **Note your backend URL:** `https://hand-game-tracker-api.onrender.com` (or your service name)

### Verify Backend

Once deployed, test the health endpoint:
```bash
curl https://your-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "db": "connected",
  "timestamp": "2024-12-05T..."
}
```

If `"db": "disconnected"`, check:
- MongoDB URI is correct
- IP whitelist in MongoDB Atlas includes Render IPs (or `0.0.0.0/0`)
- Check Render logs for connection errors

---

## 🎨 Step 3: Deploy Frontend to Vercel

### Vercel Configuration

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository: `game-record`
4. Configure project:

   **Framework Preset:** `Vite`
   - Vercel should auto-detect this

   **Build Settings:**
   - **Root Directory:** `./` (project root)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

   **Environment Variables:**
   - Click **"Environment Variables"**
   - Add:
     ```
     VITE_API_URL=https://your-backend.onrender.com/api
     ```
     ⚠️ **Replace** `your-backend.onrender.com` with your actual Render backend URL
   
   - Optional:
     ```
     VITE_USER_ID=default
     ```

5. Click **"Deploy"**
6. Wait for deployment (1-2 minutes)
7. **Note your frontend URL:** `https://your-app.vercel.app`

### Update Backend CORS

1. Go back to Render Dashboard
2. Select your backend service
3. Go to **"Environment"** tab
4. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
   ⚠️ **Replace** with your actual Vercel URL
5. Render will auto-redeploy

---

## ✅ Step 4: Verify Deployment

### Test Backend Health

```bash
curl https://your-backend.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "db": "connected"
}
```

### Test API Endpoint

```bash
curl https://your-backend.onrender.com/api/app-data?userId=test
```

Should return:
```json
{
  "allPlayers": [],
  "sets": []
}
```

### Test Frontend

1. Open your Vercel URL in browser
2. Open browser DevTools → Console
3. Look for: `✅ Loaded app data from MongoDB`
4. Add a player and verify it saves
5. Refresh page - data should persist

### Run Verification Script

```bash
export VITE_API_URL=https://your-backend.onrender.com/api
npm run verify:deployment
```

Expected output:
```
✅ Health Check Endpoint: PASS
✅ App Data Endpoint: PASS
✅ Database: CONNECTED
🎉 All checks passed!
```

---

## 📋 Environment Variables Summary

### Render (Backend)

| Variable | Value | Notes |
|----------|-------|-------|
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB connection string |
| `DB_NAME` | `game-record` | Database name |
| `PORT` | `5200` | Port (Render may override) |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Your Vercel frontend URL |

### Vercel (Frontend)

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | `https://your-backend.onrender.com/api` | Your Render backend URL + `/api` |
| `VITE_USER_ID` | `default` | Optional, for multi-user support |

---

## 🔍 Troubleshooting

### Backend Issues

**"db: disconnected" in health check:**
1. Check MongoDB URI in Render environment variables
2. Verify password is correct (no URL encoding needed - server handles it)
3. Check MongoDB Atlas → Network Access → IP whitelist
4. Add `0.0.0.0/0` to allow all IPs (for Render)
5. Check Render logs: Render Dashboard → Your Service → Logs

**Build fails:**
1. Check Render logs for TypeScript errors
2. Verify `Root Directory` is set to `server`
3. Ensure `Build Command` is `npm install && npm run build`

**CORS errors:**
1. Verify `FRONTEND_URL` matches your Vercel URL exactly
2. Include `https://` in the URL
3. Check backend logs for CORS errors

### Frontend Issues

**"Failed to load app data":**
1. Check `VITE_API_URL` in Vercel environment variables
2. Verify backend is running: `curl https://your-backend.onrender.com/health`
3. Check browser console for errors
4. Verify URL ends with `/api`

**Environment variables not working:**
1. Variables must start with `VITE_` for Vite
2. Redeploy after adding environment variables
3. Clear browser cache

**Build fails:**
1. Check Vercel build logs
2. Verify `Output Directory` is `dist`
3. Ensure all dependencies are in `package.json`

---

## 📊 Deployment URLs Checklist

After deployment, fill in your URLs:

- [ ] **GitHub Repository:** `https://github.com/YOUR_USERNAME/game-record`
- [ ] **Render Backend:** `https://your-backend.onrender.com`
- [ ] **Vercel Frontend:** `https://your-app.vercel.app`
- [ ] **Backend Health:** `https://your-backend.onrender.com/health` ✅
- [ ] **Backend API:** `https://your-backend.onrender.com/api/app-data` ✅

---

## 🎯 Final Verification

Run this complete test:

```bash
# Set your backend URL
export BACKEND_URL=https://your-backend.onrender.com
export FRONTEND_URL=https://your-app.vercel.app

# Test backend
echo "Testing backend health..."
curl $BACKEND_URL/health

echo "\nTesting API..."
curl "$BACKEND_URL/api/app-data?userId=test"

# Test frontend (open in browser)
echo "\nFrontend URL: $FRONTEND_URL"
```

All tests should pass! 🎉

---

## 📝 Post-Deployment

1. **Update README.md** with production URLs
2. **Bookmark** your Render and Vercel dashboards
3. **Monitor** logs for the first few days
4. **Set up** monitoring/alerts if needed
5. **Document** any custom configurations

---

## 🆘 Support

If you encounter issues:
1. Check Render logs: Dashboard → Service → Logs
2. Check Vercel logs: Dashboard → Project → Deployments → Logs
3. Run local tests: `cd server && npm run test:mongo`
4. Review `DEPLOYMENT.md` for detailed troubleshooting

---

**Deployment Status:** ✅ Ready to Deploy

All code is committed, builds are passing, and configuration is complete!

