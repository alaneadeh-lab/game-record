# Quick Setup Guide: MongoDB + Production

## What You Need to Do

### 1. Set Up MongoDB (Choose One)

#### Option A: MongoDB Atlas (Free, Recommended)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a free cluster (M0)
4. Create database user (Database Access)
5. Whitelist IP: `0.0.0.0/0` (Network Access)
6. Get connection string (Connect → Connect your application)
7. Copy the connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/`)

#### Option B: Local MongoDB
```bash
# Install MongoDB locally, then use:
MONGODB_URI=mongodb://localhost:27017
```

### 2. Set Up Backend Server

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your MongoDB connection string
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/game-record?retryWrites=true&w=majority
# DB_NAME=game-record
# PORT=5200

# Run development server
npm run dev
```

The backend will run on `http://localhost:5200`

### 3. Update Frontend to Use MongoDB

```bash
# In project root, create .env file
echo "VITE_API_URL=http://localhost:5200/api" > .env

# Rebuild frontend
npm run build
```

### 4. Test Locally

1. Start backend: `cd server && npm run dev`
2. Start frontend: `npm run dev`
3. Open browser: http://localhost:5200
4. Check console for "✅ Loaded app data from MongoDB"

### 5. Deploy to Production

See `DEPLOYMENT.md` for detailed deployment instructions.

## Quick Commands

```bash
# Backend
cd server
npm install
npm run dev          # Development
npm run build        # Build for production
npm start            # Run production build

# Frontend
npm install
npm run dev          # Development
npm run build        # Build for production
```

## Environment Variables

### Backend (server/.env)
```
MONGODB_URI=mongodb+srv://...
DB_NAME=game-record
PORT=5200
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5200/api
# Or for production:
# VITE_API_URL=https://your-backend-url.com/api
```

## Troubleshooting

- **Backend won't start:** Check MongoDB connection string
- **Frontend can't connect:** Check `VITE_API_URL` matches backend URL
- **CORS errors:** Backend has CORS enabled, should work
- **Data not saving:** Check backend logs and MongoDB connection

