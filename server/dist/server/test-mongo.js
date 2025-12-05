/**
 * MongoDB Connection Test Script
 * Tests the MongoDB connection using environment variables
 */
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
// Load environment variables
dotenv.config();
const MONGODB_URI_RAW = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'game-record';
async function testConnection() {
    console.log('🧪 Testing MongoDB Connection...\n');
    if (!MONGODB_URI_RAW) {
        console.error('❌ MONGODB_URI is not set in environment variables');
        console.error('   Please set MONGODB_URI in your .env file');
        process.exit(1);
    }
    // URL-encode the URI
    const MONGODB_URI = encodeURI(MONGODB_URI_RAW);
    console.log(`📊 Configuration:`);
    console.log(`   URI: ${MONGODB_URI_RAW.replace(/:[^:@]+@/, ':****@')}`); // Hide password
    console.log(`   Database: ${DB_NAME}\n`);
    let client = null;
    try {
        console.log('🔌 Attempting to connect...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB cluster');
        // Test ping
        await client.db('admin').command({ ping: 1 });
        console.log('✅ Ping successful');
        // Test database access
        const db = client.db(DB_NAME);
        const collections = await db.listCollections().toArray();
        console.log(`✅ Database "${DB_NAME}" accessible`);
        console.log(`   Collections: ${collections.length} (${collections.map(c => c.name).join(', ') || 'none'})`);
        // Test write/read
        const testCollection = db.collection('_connection_test');
        const testDoc = {
            test: true,
            timestamp: new Date(),
            message: 'Connection test document'
        };
        const insertResult = await testCollection.insertOne(testDoc);
        console.log(`✅ Write test successful (inserted ID: ${insertResult.insertedId})`);
        const readDoc = await testCollection.findOne({ _id: insertResult.insertedId });
        if (readDoc) {
            console.log('✅ Read test successful');
        }
        // Cleanup test document
        await testCollection.deleteOne({ _id: insertResult.insertedId });
        console.log('✅ Cleanup successful');
        console.log('\n🎉 All tests passed! MongoDB connection is working correctly.\n');
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ Connection test failed!');
        console.error(`   Error: ${error.message}`);
        if (error.message.includes('authentication')) {
            console.error('\n💡 Authentication failed. Check:');
            console.error('   - Username is correct');
            console.error('   - Password is correct (may need URL encoding)');
            console.error('   - Database user has proper permissions');
        }
        else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.error('\n💡 Network error. Check:');
            console.error('   - Cluster hostname is correct');
            console.error('   - Internet connection');
            console.error('   - Firewall settings');
        }
        else if (error.message.includes('IP')) {
            console.error('\n💡 IP whitelist error. Check:');
            console.error('   - Your IP is whitelisted in MongoDB Atlas');
            console.error('   - Network Access settings allow your IP');
        }
        console.error('\n📖 Full error details:');
        console.error(error);
        process.exit(1);
    }
    finally {
        if (client) {
            await client.close();
            console.log('🔌 Connection closed');
        }
    }
}
// Run the test
testConnection();
