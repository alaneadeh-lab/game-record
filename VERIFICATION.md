# Production Deployment Verification

## ✅ Current Configuration

### Frontend (Vercel)
- **URL:** `https://game-record-jet.vercel.app`
- **Environment Variable:**
  - `VITE_API_URL` = `https://game-record-backend.onrender.com/api` ✅

### Backend (Render)
- **URL:** `https://game-record-backend.onrender.com`
- **Required Environment Variables:**
  - `MONGODB_URI` = (your MongoDB connection string)
  - `DB_NAME` = `game-record`
  - `PORT` = `5200`
  - `FRONTEND_URL` = `https://game-record-jet.vercel.app` ⚠️ **VERIFY THIS**

## 🔍 Verification Steps

### 1. Test Backend Health
```bash
curl https://game-record-backend.onrender.com/health
```
**Expected:** `{"status":"ok","db":"connected",...}`

### 2. Test CORS Configuration
```bash
curl https://game-record-backend.onrender.com/cors-test
```
**Expected:** Shows CORS configuration

### 3. Test API Endpoint
```bash
curl https://game-record-backend.onrender.com/api/app-data?userId=test
```
**Expected:** `{"allPlayers":[],"sets":[]}`

### 4. Test from Browser Console
Open `https://game-record-jet.vercel.app` and run:
```javascript
fetch('https://game-record-backend.onrender.com/cors-test')
  .then(r => r.json())
  .then(console.log)
```

## ⚠️ Important: Update Backend CORS

**In Render Dashboard:**
1. Go to your backend service → Environment
2. Verify `FRONTEND_URL` is set to:
   ```
   https://game-record-jet.vercel.app
   ```
3. If it's different or missing, update it and redeploy

## 🐛 Troubleshooting

### If you see CORS errors:
- Backend `FRONTEND_URL` must match exactly: `https://game-record-jet.vercel.app`
- No trailing slash
- Must use `https://` not `http://`

### If backend returns errors:
- Check Render logs
- Verify MongoDB connection
- Test health endpoint

### If frontend shows "No Player Set":
- This is normal for a new deployment
- Click "Create New Set" to get started
- Check browser console for connection errors

