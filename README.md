# Hand Game Tracker

A mobile-friendly web application for tracking "Hand" card game results among friends.

## Features

- **Players View**: Display players with photos, names, points, Fatts, and medals
- **Admin Panel**: Access with PIN code (88) to enter game results and manage players
- **Multiple Sets**: Create and switch between different player sets
- **Player Inventory**: Global player management system
- **Medal System**: Automatic medal calculation (Gold: 3pts, Silver: 2pts, Bronze: 1pt)
- **Winner Indicators**: Animated crown for 1st place, fly swarm for last place
- **3D Card Effects**: Beautiful card-themed UI with 3D buttons and table effects
- **Mobile Responsive**: Optimized for mobile devices (iPhone 14 Pro Max tested)
- **MongoDB Support**: Production-ready with MongoDB backend

## Getting Started

### Local Development (localStorage)

```bash
npm install
npm run dev
```

### With MongoDB Backend

1. Set up MongoDB (see `SETUP.md`)
2. Start backend: `cd server && npm install && npm run dev`
3. Create `.env` file: `VITE_API_URL=http://localhost:5200/api`
4. Start frontend: `npm run dev`

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB
- **Animations**: Lottie React, Framer Motion
- **Icons**: Lucide React

## Project Structure

```
game-record/
├── src/              # Frontend React app
│   ├── components/   # React components
│   ├── services/     # Storage services (localStorage/MongoDB)
│   ├── utils/        # Utility functions
│   └── types.ts      # TypeScript definitions
├── server/           # Backend API server
│   ├── index.ts      # Express server
│   └── package.json  # Backend dependencies
└── scripts/          # Utility scripts
```

## Storage Options

- **localStorage** (default): Works offline, limited to ~5-10MB
- **MongoDB** (production): Unlimited storage, multi-device sync

See `SETUP.md` for MongoDB setup and `DEPLOYMENT.md` for production deployment.
