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
        // DIAGNOSTIC: Log database and collection info
        console.log(`🔍 [DIAGNOSTIC] Loading app data:`, {
            dbName: DB_NAME,
            collectionName: COLLECTION_NAME,
            userId: userId,
            queryFilter: { userId },
        });
        const doc = await collection.findOne({ userId });
        if (doc) {
            console.log(`✅ [DIAGNOSTIC] Document found for user: ${userId}`);
            // DIAGNOSTIC: Log document structure
            const topLevelKeys = Object.keys(doc);
            const dataKeys = doc.data ? Object.keys(doc.data) : [];
            const docDataKeys = doc.data ? Object.keys(doc.data) : [];
            console.log(`📊 [DIAGNOSTIC] Document structure:`, {
                topLevelKeys: topLevelKeys,
                hasDataField: 'data' in doc,
                dataKeys: docDataKeys,
                hasAllPlayersAtRoot: 'allPlayers' in doc,
                hasSetsAtRoot: 'sets' in doc,
                allPlayersType: typeof doc.allPlayers,
                setsType: typeof doc.sets,
                allPlayersIsArray: Array.isArray(doc.allPlayers),
                setsIsArray: Array.isArray(doc.sets),
                allPlayersLength: Array.isArray(doc.allPlayers) ? doc.allPlayers.length : 'N/A',
                setsLength: Array.isArray(doc.sets) ? doc.sets.length : 'N/A',
            });
            // DIAGNOSTIC: Check for game entries in various locations
            let gameEntriesFound = false;
            let gameEntriesLocation = 'none';
            let gameEntriesCount = 0;
            // Check in doc.data.sets[].gameEntries
            if (doc.data?.sets && Array.isArray(doc.data.sets)) {
                const totalInDataSets = doc.data.sets.reduce((sum, set) => {
                    if (Array.isArray(set.gameEntries)) {
                        return sum + set.gameEntries.length;
                    }
                    return sum;
                }, 0);
                if (totalInDataSets > 0) {
                    gameEntriesFound = true;
                    gameEntriesLocation = 'doc.data.sets[].gameEntries';
                    gameEntriesCount = totalInDataSets;
                }
            }
            // Check in doc.sets[].gameEntries (root level)
            if (!gameEntriesFound && doc.sets && Array.isArray(doc.sets)) {
                const totalInRootSets = doc.sets.reduce((sum, set) => {
                    if (Array.isArray(set.gameEntries)) {
                        return sum + set.gameEntries.length;
                    }
                    return sum;
                }, 0);
                if (totalInRootSets > 0) {
                    gameEntriesFound = true;
                    gameEntriesLocation = 'doc.sets[].gameEntries';
                    gameEntriesCount = totalInRootSets;
                }
            }
            // Check for other possible keys
            const possibleGameEntryKeys = ['gameEntries', 'games', 'entries', 'records', 'history'];
            for (const key of possibleGameEntryKeys) {
                if (doc.data && key in doc.data && Array.isArray(doc.data[key]) && doc.data[key].length > 0) {
                    gameEntriesFound = true;
                    gameEntriesLocation = `doc.data.${key}`;
                    gameEntriesCount = doc.data[key].length;
                    break;
                }
                if (key in doc && Array.isArray(doc[key]) && doc[key].length > 0) {
                    gameEntriesFound = true;
                    gameEntriesLocation = `doc.${key}`;
                    gameEntriesCount = doc[key].length;
                    break;
                }
            }
            console.log(`🎮 [DIAGNOSTIC] Game entries search:`, {
                gameEntriesFound: gameEntriesFound,
                gameEntriesLocation: gameEntriesLocation,
                gameEntriesCount: gameEntriesCount,
                searchedKeys: possibleGameEntryKeys,
            });
            // Handle both structures: data nested or at root level (after restore)
            let appData;
            if (doc.data && (doc.data.allPlayers || doc.data.sets)) {
                // Standard structure: data nested inside doc.data
                appData = doc.data;
                console.log(`📊 Using nested data structure`);
            }
            else if (doc.allPlayers || doc.sets) {
                // Restored structure: data at root level
                console.log(`⚠️ Detected root-level structure (from restore), converting...`);
                appData = {
                    allPlayers: Array.isArray(doc.allPlayers) ? doc.allPlayers : [],
                    sets: Array.isArray(doc.sets) ? doc.sets : [],
                };
            }
            else {
                // Fallback: return empty structure
                console.log(`⚠️ No data found in expected locations, returning empty structure`);
                appData = { allPlayers: [], sets: [] };
            }
            // DIAGNOSTIC: Log final appData structure
            console.log(`📊 [DIAGNOSTIC] Final appData structure:`, {
                hasAppData: !!appData,
                appDataKeys: Object.keys(appData),
                playersCount: appData.allPlayers?.length || 0,
                setsCount: appData.sets?.length || 0,
                totalGames: appData.sets?.reduce((sum, set) => sum + (Array.isArray(set.gameEntries) ? set.gameEntries.length : 0), 0) || 0,
                setsDetails: appData.sets?.map((s) => ({
                    id: s.id,
                    name: s.name,
                    playerCount: Array.isArray(s.playerIds) ? s.playerIds.length : 0,
                    setKeys: Object.keys(s),
                    hasGameEntries: 'gameEntries' in s,
                    gameEntriesType: typeof s.gameEntries,
                    gameEntriesIsArray: Array.isArray(s.gameEntries),
                    gameCount: Array.isArray(s.gameEntries) ? s.gameEntries.length : 0,
                })) || [],
            });
            res.json(appData);
        }
        else {
            // Return default structure
            const defaultData = {
                allPlayers: [],
                sets: [],
            };
            console.log(`ℹ️ [DIAGNOSTIC] No document found for user: ${userId}, returning default`);
            res.json(defaultData);
        }
    }
    catch (error) {
        console.error('❌ Error loading app data:', error);
        res.status(500).json({ error: 'Failed to load app data' });
    }
});
// Diagnostic endpoint - Get detailed info about stored data
app.get('/api/app-data/diagnostic', async (req, res) => {
    try {
        if (!db) {
            addCorsHeaders(req, res);
            return res.status(503).json({ error: 'Database not connected' });
        }
        const userId = req.query.userId || 'default';
        const collection = db.collection(COLLECTION_NAME);
        // Get document count
        const documentCount = await collection.countDocuments({});
        const userDocumentCount = await collection.countDocuments({ userId });
        // Get all documents for this user (in case there are multiple)
        const docs = await collection.find({ userId }).toArray();
        // Get all documents regardless of userId (for debugging)
        const allDocs = await collection.find({}).toArray();
        // Extract MongoDB host from URI (redact credentials)
        const mongoUriHost = MONGODB_URI_RAW
            ? MONGODB_URI_RAW.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://****:****@')
            : 'not configured';
        // Analyze the found document for game entries
        const foundDoc = docs.length > 0 ? docs[0] : null;
        let gameEntriesFound = false;
        let gameEntriesLocation = 'none';
        let gameEntriesCount = 0;
        const searchedKeys = ['gameEntries', 'games', 'entries', 'records', 'history'];
        if (foundDoc) {
            // Check in doc.data.sets[].gameEntries
            if (foundDoc.data?.sets && Array.isArray(foundDoc.data.sets)) {
                const totalInDataSets = foundDoc.data.sets.reduce((sum, set) => {
                    if (Array.isArray(set.gameEntries)) {
                        return sum + set.gameEntries.length;
                    }
                    return sum;
                }, 0);
                if (totalInDataSets > 0) {
                    gameEntriesFound = true;
                    gameEntriesLocation = 'doc.data.sets[].gameEntries';
                    gameEntriesCount = totalInDataSets;
                }
            }
            // Check in doc.sets[].gameEntries (root level)
            if (!gameEntriesFound && foundDoc.sets && Array.isArray(foundDoc.sets)) {
                const totalInRootSets = foundDoc.sets.reduce((sum, set) => {
                    if (Array.isArray(set.gameEntries)) {
                        return sum + set.gameEntries.length;
                    }
                    return sum;
                }, 0);
                if (totalInRootSets > 0) {
                    gameEntriesFound = true;
                    gameEntriesLocation = 'doc.sets[].gameEntries';
                    gameEntriesCount = totalInRootSets;
                }
            }
            // Check for other possible keys
            for (const key of searchedKeys) {
                if (foundDoc.data && key in foundDoc.data && Array.isArray(foundDoc.data[key]) && foundDoc.data[key].length > 0) {
                    gameEntriesFound = true;
                    gameEntriesLocation = `doc.data.${key}`;
                    gameEntriesCount = foundDoc.data[key].length;
                    break;
                }
                if (key in foundDoc && Array.isArray(foundDoc[key]) && foundDoc[key].length > 0) {
                    gameEntriesFound = true;
                    gameEntriesLocation = `doc.${key}`;
                    gameEntriesCount = foundDoc[key].length;
                    break;
                }
            }
        }
        const diagnostic = {
            // Database connection info
            dbName: DB_NAME,
            collectionName: COLLECTION_NAME,
            mongoUriHost: mongoUriHost,
            // Query info
            requestedUserId: userId,
            queryFilter: { userId },
            // Document counts
            documentCount: documentCount,
            userDocumentCount: userDocumentCount,
            // Found document structure
            foundDocument: foundDoc ? {
                topLevelKeys: Object.keys(foundDoc),
                hasDataField: 'data' in foundDoc,
                dataKeys: foundDoc.data ? Object.keys(foundDoc.data) : [],
                hasAllPlayersAtRoot: 'allPlayers' in foundDoc,
                hasSetsAtRoot: 'sets' in foundDoc,
                allPlayersType: typeof foundDoc.allPlayers,
                setsType: typeof foundDoc.sets,
                allPlayersIsArray: Array.isArray(foundDoc.allPlayers),
                setsIsArray: Array.isArray(foundDoc.sets),
                allPlayersLength: Array.isArray(foundDoc.allPlayers) ? foundDoc.allPlayers.length : 'N/A',
                setsLength: Array.isArray(foundDoc.sets) ? foundDoc.sets.length : 'N/A',
            } : null,
            // Game entries analysis
            gameEntries: {
                found: gameEntriesFound,
                location: gameEntriesLocation,
                count: gameEntriesCount,
                searchedKeys: searchedKeys,
            },
            // Detailed document analysis
            userDocuments: docs.map((doc) => ({
                userId: doc.userId,
                topLevelKeys: Object.keys(doc),
                hasData: !!doc.data,
                dataKeys: doc.data ? Object.keys(doc.data) : [],
                dataStructure: doc.data ? {
                    hasAllPlayers: !!doc.data.allPlayers,
                    hasSets: !!doc.data.sets,
                    allPlayersCount: Array.isArray(doc.data.allPlayers) ? doc.data.allPlayers.length : 'not array',
                    setsCount: Array.isArray(doc.data.sets) ? doc.data.sets.length : 'not array',
                    setsDetails: Array.isArray(doc.data.sets) ? doc.data.sets.map((set) => ({
                        id: set.id,
                        name: set.name,
                        setKeys: Object.keys(set),
                        playerIdsCount: Array.isArray(set.playerIds) ? set.playerIds.length : 'not array',
                        hasGameEntries: 'gameEntries' in set,
                        gameEntriesType: typeof set.gameEntries,
                        gameEntriesIsArray: Array.isArray(set.gameEntries),
                        gameEntriesCount: Array.isArray(set.gameEntries) ? set.gameEntries.length : 'not array',
                        gameEntriesSample: Array.isArray(set.gameEntries) && set.gameEntries.length > 0
                            ? set.gameEntries.slice(0, 2).map((ge) => ({
                                id: ge.id,
                                date: ge.date,
                                playerScoresCount: Array.isArray(ge.playerScores) ? ge.playerScores.length : 'not array',
                            }))
                            : [],
                    })) : 'not array',
                    playersSample: Array.isArray(doc.data.allPlayers) && doc.data.allPlayers.length > 0
                        ? doc.data.allPlayers.slice(0, 2).map((p) => ({
                            id: p.id,
                            name: p.name,
                            points: p.points,
                            fatts: p.fatts,
                            hasPhoto: !!p.photo,
                        }))
                        : [],
                } : null,
                updatedAt: doc.updatedAt,
                createdAt: doc.createdAt || doc._id?.getTimestamp?.() || 'unknown',
            })),
            allDocumentsSummary: allDocs.map((doc) => ({
                userId: doc.userId,
                hasData: !!doc.data,
                topLevelKeys: Object.keys(doc),
                playersCount: doc.data?.allPlayers?.length || doc.allPlayers?.length || 0,
                setsCount: doc.data?.sets?.length || doc.sets?.length || 0,
                totalGames: (doc.data?.sets || doc.sets || []).reduce((sum, set) => sum + (Array.isArray(set.gameEntries) ? set.gameEntries.length : 0), 0) || 0,
            })),
        };
        addCorsHeaders(req, res);
        res.json(diagnostic);
    }
    catch (error) {
        console.error('❌ Error in diagnostic endpoint:', error);
        addCorsHeaders(req, res);
        res.status(500).json({
            error: 'Failed to get diagnostic info',
            message: error instanceof Error ? error.message : String(error),
        });
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
