import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
// Load environment variables FIRST
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5200;
const MONGODB_URI_RAW = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'game-record';
const COLLECTION_NAME = 'app-data';
// URL-encode the MongoDB URI to handle special characters in password
const MONGODB_URI = MONGODB_URI_RAW ? encodeURI(MONGODB_URI_RAW) : 'mongodb://localhost:27017';
// CORS configuration: Allow production URL, custom domain, and all Vercel preview deployments
const corsOptions = {
    origin: (origin, callback) => {
        const productionUrl = process.env.FRONTEND_URL;
        const customDomain = 'https://www.le3beh-tracker.com';
        // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
        if (!origin) {
            return callback(null, true);
        }
        // If no FRONTEND_URL is set, allow all origins (development mode)
        if (!productionUrl) {
            return callback(null, true);
        }
        // Allow production URL
        if (origin === productionUrl) {
            return callback(null, true);
        }
        // Allow custom domain (www.le3beh-tracker.com and non-www version)
        if (origin === customDomain || origin === 'https://le3beh-tracker.com' || origin === 'http://www.le3beh-tracker.com' || origin === 'http://le3beh-tracker.com') {
            console.log(`✅ CORS: Allowing custom domain: ${origin}`);
            return callback(null, true);
        }
        // Allow all Vercel preview deployments (*.vercel.app)
        // This matches patterns like:
        // - https://game-record-jet.vercel.app (production)
        // - https://game-record-abc123.vercel.app (preview)
        // - https://game-record-ap2a-n4u6w5bot-alaneadeh-labs-projects.vercel.app (preview)
        if (/^https:\/\/[^/]+\.vercel\.app$/.test(origin)) {
            console.log(`✅ CORS: Allowing Vercel origin: ${origin}`);
            return callback(null, true);
        }
        // Deny all other origins
        console.log(`❌ CORS: Blocked origin: ${origin} (expected: ${productionUrl}, ${customDomain}, or *.vercel.app)`);
        callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    },
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: false,
};
// Middleware - CORS must come first
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Support large Base64 images
// Helper to add CORS headers manually if needed
const addCorsHeaders = (req, res) => {
    const origin = req.headers.origin;
    if (origin) {
        const customDomain = 'https://www.le3beh-tracker.com';
        const productionUrl = process.env.FRONTEND_URL;
        if (!productionUrl || // Development mode - allow all
            origin === productionUrl ||
            origin === customDomain ||
            origin === 'https://le3beh-tracker.com' ||
            origin === 'http://www.le3beh-tracker.com' ||
            origin === 'http://le3beh-tracker.com' ||
            /^https:\/\/[^/]+\.vercel\.app$/.test(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.setHeader('Access-Control-Allow-Credentials', 'false');
        }
    }
};
let db = null;
let client = null;
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
        }
        catch (indexError) {
            console.warn('⚠️ Index creation warning (may already exist):', indexError);
        }
    }
    catch (error) {
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
        }
        catch (error) {
            // Connection lost, try to reconnect
            isConnected = false;
            db = null;
            await connectDB();
            if (isConnected) {
                dbStatus = 'connected';
            }
        }
    }
    else {
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
            addCorsHeaders(req, res);
            return res.status(503).json({ error: 'Database not connected' });
        }
        const userId = req.query.userId || 'default';
        const collection = db.collection(COLLECTION_NAME);
        const doc = await collection.findOne({ userId });
        if (doc) {
            console.log(`✅ Loaded app data for user: ${userId}`);
            res.json(doc.data);
        }
        else {
            // Return default structure
            const defaultData = {
                allPlayers: [],
                sets: [],
            };
            console.log(`ℹ️ No data found for user: ${userId}, returning default`);
            res.json(defaultData);
        }
    }
    catch (error) {
        console.error('❌ Error loading app data:', error);
        res.status(500).json({ error: 'Failed to load app data' });
    }
});
// Upload/Import app data (POST endpoint for data migration)
app.post('/api/app-data/upload', async (req, res) => {
    try {
        if (!db) {
            addCorsHeaders(req, res);
            return res.status(503).json({ error: 'Database not connected' });
        }
        const userId = req.body.userId || 'default';
        const data = req.body.data;
        if (!data || !data.allPlayers || !data.sets) {
            addCorsHeaders(req, res);
            return res.status(400).json({ error: 'Invalid data format. Expected: { allPlayers: [], sets: [] }' });
        }
        const collection = db.collection(COLLECTION_NAME);
        // Upsert (update or insert)
        await collection.updateOne({ userId }, {
            $set: {
                userId,
                data,
                updatedAt: new Date(),
            }
        }, { upsert: true });
        const sizeInMB = (JSON.stringify(data).length / (1024 * 1024)).toFixed(2);
        console.log(`✅ Uploaded app data for user: ${userId} (${sizeInMB}MB)`);
        console.log(`   Players: ${data.allPlayers.length}, Sets: ${data.sets.length}`);
        res.json({
            success: true,
            message: 'Data uploaded successfully',
            stats: {
                players: data.allPlayers.length,
                sets: data.sets.length,
                sizeMB: sizeInMB,
            }
        });
    }
    catch (error) {
        console.error('❌ Error uploading app data:', error);
        addCorsHeaders(req, res);
        res.status(500).json({ error: 'Failed to upload app data' });
    }
});
// Save app data
app.put('/api/app-data', async (req, res) => {
    try {
        if (!db) {
            addCorsHeaders(req, res);
            return res.status(503).json({ error: 'Database not connected' });
        }
        const userId = req.body.userId || 'default';
        const data = req.body.data;
        if (!data || !data.allPlayers || !data.sets) {
            addCorsHeaders(req, res);
            return res.status(400).json({ error: 'Invalid data format' });
        }
        const collection = db.collection(COLLECTION_NAME);
        // Upsert (update or insert)
        await collection.updateOne({ userId }, {
            $set: {
                userId,
                data,
                updatedAt: new Date(),
            }
        }, { upsert: true });
        const sizeInMB = (JSON.stringify(data).length / (1024 * 1024)).toFixed(2);
        console.log(`✅ Saved app data for user: ${userId} (${sizeInMB}MB)`);
        res.json({ success: true, message: 'Data saved successfully' });
    }
    catch (error) {
        console.error('❌ Error saving app data:', error);
        addCorsHeaders(req, res);
        res.status(500).json({ error: 'Failed to save app data' });
    }
});
// Global error handler - must be last
app.use((err, req, res, next) => {
    addCorsHeaders(req, res);
    console.error('❌ Unhandled server error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
// 404 handler
app.use((req, res) => {
    addCorsHeaders(req, res);
    res.status(404).json({ error: 'Not found' });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 MongoDB URI: ${MONGODB_URI_RAW ? 'Set (password hidden)' : 'Not set'}`);
    console.log(`💾 Database: ${DB_NAME}`);
    console.log(`🌐 CORS Origins: ${process.env.FRONTEND_URL || 'All origins (*)'}, https://www.le3beh-tracker.com`);
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
