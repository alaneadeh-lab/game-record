import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import type { AppData } from '../src/types';

// Load environment variables FIRST
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5200;
const MONGODB_URI_RAW = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'game-record';
const COLLECTION_NAME = 'app-data';

// URL-encode the MongoDB URI to handle special characters in password
const MONGODB_URI = MONGODB_URI_RAW ? encodeURI(MONGODB_URI_RAW) : 'mongodb://localhost:27017';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '50mb' })); // Support large Base64 images

let db: any = null;
let client: MongoClient | null = null;
let isConnected = false;

// Connect to MongoDB (singleton pattern)
async function connectDB() {
  if (isConnected && client) {
    console.log('ℹ️ MongoDB already connected, reusing connection');
    return;
  }

  if (!MONGODB_URI_RAW) {
    console.error('❌ MONGODB_URI is not set in environment variables');
    return;
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log(`   URI: ${MONGODB_URI_RAW.replace(/:[^:@]+@/, ':****@')}`); // Hide password in logs
    console.log(`   Database: ${DB_NAME}`);
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    // Test the connection
    await client.db('admin').command({ ping: 1 });
    
    db = client.db(DB_NAME);
    isConnected = true;
    
    console.log('✅ Connected to MongoDB successfully');
    console.log(`   Database: ${DB_NAME}`);
    
    // Create index for faster lookups
    try {
      await db.collection(COLLECTION_NAME).createIndex({ userId: 1 });
      console.log('✅ Created index on userId');
    } catch (indexError) {
      console.warn('⚠️ Index creation warning (may already exist):', indexError);
    }
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('   Full error:', error);
    isConnected = false;
    db = null;
    // Don't throw - allow server to start but mark as disconnected
  }
}

// Initialize connection
connectDB().catch((error) => {
  console.error('❌ Failed to initialize MongoDB connection:', error);
});

// CORS test endpoint
app.get('/cors-test', (req, res) => {
  const origin = req.query.origin;
  const allowedOrigins = process.env.FRONTEND_URL || '*';
  res.json({
    status: 'cors-test-ok',
    yourRequestOrigin: req.headers.origin || null,
    queryOrigin: origin || null,
    allowedOrigins: allowedOrigins,
  });
});

// Health check
app.get('/health', async (req, res) => {
  // Check if we have an active connection
  let dbStatus = 'disconnected';
  
  if (client && isConnected) {
    try {
      // Ping the database to verify connection is still alive
      await client.db('admin').command({ ping: 1 });
      dbStatus = 'connected';
    } catch (error) {
      // Connection lost, try to reconnect
      isConnected = false;
      db = null;
      await connectDB();
      if (isConnected) {
        dbStatus = 'connected';
      }
    }
  } else {
    // Try to connect if not connected
    await connectDB();
    if (isConnected) {
      dbStatus = 'connected';
    }
  }
  
  res.json({ 
    status: 'ok', 
    db: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Get app data (for a specific user or default)
app.get('/api/app-data', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const userId = req.query.userId as string || 'default';
    const collection = db.collection(COLLECTION_NAME);
    
    const doc = await collection.findOne({ userId });
    
    if (doc) {
      console.log(`✅ Loaded app data for user: ${userId}`);
      res.json(doc.data);
    } else {
      // Return default structure
      const defaultData: AppData = {
        allPlayers: [],
        sets: [],
      };
      console.log(`ℹ️ No data found for user: ${userId}, returning default`);
      res.json(defaultData);
    }
  } catch (error) {
    console.error('❌ Error loading app data:', error);
    res.status(500).json({ error: 'Failed to load app data' });
  }
});

// Save app data
app.put('/api/app-data', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const userId = (req.body.userId as string) || 'default';
    const data: AppData = req.body.data;

    if (!data || !data.allPlayers || !data.sets) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const collection = db.collection(COLLECTION_NAME);
    
    // Upsert (update or insert)
    await collection.updateOne(
      { userId },
      { 
        $set: { 
          userId,
          data,
          updatedAt: new Date(),
        } 
      },
      { upsert: true }
    );

    const sizeInMB = (JSON.stringify(data).length / (1024 * 1024)).toFixed(2);
    console.log(`✅ Saved app data for user: ${userId} (${sizeInMB}MB)`);
    
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('❌ Error saving app data:', error);
    res.status(500).json({ error: 'Failed to save app data' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 MongoDB URI: ${MONGODB_URI_RAW ? 'Set (password hidden)' : 'Not set'}`);
  console.log(`💾 Database: ${DB_NAME}`);
  console.log(`🌐 CORS Origin: ${process.env.FRONTEND_URL || 'All origins (*)'}`);
  console.log(`\n📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/app-data\n`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing MongoDB connection...');
  if (client) {
    await client.close();
  }
  process.exit(0);
});

