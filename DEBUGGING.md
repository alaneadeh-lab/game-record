# Debugging Production Deployment

## Current Issue: "No Player Set" Screen

This screen appears when:
- No player sets are loaded from storage
- Backend connection failed
- MongoDB returned empty data

## Quick Debugging Steps

### 1. Check Browser Console

Open DevTools (F12) → Console tab and look for:

**✅ Good signs:**
```
✅ Loaded app data from MongoDB: 0 sets, 0 players
```

**❌ Bad signs:**
```
❌ Error loading app data from MongoDB: ...
Failed to fetch
CORS error
```

### 2. Check Network Tab

1. Open DevTools → Network tab
2. Refresh the page
3. Look for requests to your backend:
   - `GET /api/app-data?userId=default`
   - Status should be `200 OK`
   - Response should be: `{"allPlayers":[],"sets":[]}`

**If you see CORS errors:**
- Backend `FRONTEND_URL` doesn't match your Vercel URL
- Check Render environment variables

**If you see 404 or connection refused:**
- Backend URL is incorrect
- Backend is not deployed/running
- Check `VITE_API_URL` in Vercel environment variables

### 3. Test Backend Directly

```bash
# Test health endpoint
curl https://your-backend.onrender.com/health

# Test CORS endpoint
curl https://your-backend.onrender.com/cors-test

# Test API endpoint
curl https://your-backend.onrender.com/api/app-data?userId=test
```

### 4. Verify Environment Variables

**Vercel (Frontend):**
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Verify `VITE_API_URL` is set to: `https://your-backend.onrender.com/api`
- Must include `/api` at the end
- Redeploy after adding/changing variables

**Render (Backend):**
- Go to Render Dashboard → Your Service → Environment
- Verify:
  - `MONGODB_URI` is set
  - `DB_NAME=game-record`
  - `FRONTEND_URL=https://game-record-jet.vercel.app` (your Vercel URL)

### 5. Create Your First Set

If backend is working but you have no data:

1. Click "Create New Set" button
2. This opens the Player Set Selector
3. You'll need to add players first:
   - Click the admin button (bottom-right)
   - Enter PIN: `88`
   - Go to "Players" tab
   - Click "Open Player Inventory"
   - Add at least 4 players
4. Then create a set with those players

## Common Issues

### Issue: CORS Errors

**Symptoms:**
- Console shows: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Fix:**
1. Check Render → Environment → `FRONTEND_URL`
2. Must match exactly: `https://game-record-jet.vercel.app`
3. Include `https://` (not `http://`)
4. No trailing slash
5. Redeploy backend after changing

### Issue: Backend Not Responding

**Symptoms:**
- Network tab shows failed requests
- Console shows: `Failed to fetch` or `Network error`

**Fix:**
1. Check Render dashboard → Your service is running
2. Check Render logs for errors
3. Verify backend URL in `VITE_API_URL`
4. Test backend directly with curl (see step 3 above)

### Issue: Empty Data (This is Normal!)

**Symptoms:**
- App loads but shows "No Player Set"
- Console shows: `✅ Loaded app data from MongoDB: 0 sets, 0 players`

**Fix:**
- This is expected for a new deployment!
- Click "Create New Set" to get started
- Add players through admin panel first

## Testing Checklist

- [ ] Backend health endpoint returns `{"status":"ok","db":"connected"}`
- [ ] Backend CORS test endpoint works
- [ ] Frontend `VITE_API_URL` is set correctly
- [ ] Backend `FRONTEND_URL` matches Vercel URL
- [ ] No CORS errors in browser console
- [ ] Network tab shows successful API calls
- [ ] Can create players and sets

## Next Steps

Once you verify the backend is working:
1. Click "Create New Set"
2. Add players through admin panel
3. Create your first player set
4. Start tracking games!

