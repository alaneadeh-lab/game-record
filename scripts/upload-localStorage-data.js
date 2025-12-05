#!/usr/bin/env node

/**
 * Script to upload localStorage data to MongoDB via backend API
 * 
 * Usage:
 * 1. Open browser console on your local app
 * 2. Copy the localStorage data:
 *    localStorage.getItem('game-record-data')
 * 3. Save it to a file or paste it here
 * 4. Run: node scripts/upload-localStorage-data.js <data-file.json>
 * 
 * Or use the browser console method below
 */

const API_URL = process.env.API_URL || 'https://game-record-backend.onrender.com/api';
const USER_ID = process.env.USER_ID || 'default';

async function uploadData(data) {
  try {
    console.log('📤 Uploading data to backend...');
    console.log(`   API: ${API_URL}/app-data/upload`);
    console.log(`   Players: ${data.allPlayers?.length || 0}`);
    console.log(`   Sets: ${data.sets?.length || 0}`);

    const response = await fetch(`${API_URL}/app-data/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: USER_ID,
        data: data,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Upload successful!');
    console.log('   Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    throw error;
  }
}

// If run from command line with file argument
if (process.argv[2]) {
  const fs = require('fs');
  const filePath = process.argv[2];
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Handle both old format (array of sets) and new format (AppData)
    let appData;
    if (Array.isArray(data)) {
      // Old format - convert to new format
      console.log('🔄 Detected old format, converting...');
      const allPlayersMap = new Map();
      data.forEach(set => {
        if (set.players) {
          set.players.forEach(player => {
            if (!allPlayersMap.has(player.id)) {
              allPlayersMap.set(player.id, player);
            }
          });
        }
      });
      appData = {
        allPlayers: Array.from(allPlayersMap.values()),
        sets: data.map(set => ({
          id: set.id,
          name: set.name,
          playerIds: set.players ? set.players.map(p => p.id) : [],
          gameEntries: set.gameEntries || [],
        })),
      };
    } else if (data.allPlayers && data.sets) {
      // New format
      appData = data;
    } else {
      throw new Error('Invalid data format');
    }
    
    uploadData(appData)
      .then(() => {
        console.log('\n🎉 Data migration complete!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
      });
  } catch (error) {
    console.error('❌ Error reading file:', error.message);
    process.exit(1);
  }
} else {
  console.log(`
📋 localStorage Data Upload Script

Method 1: Browser Console (Easiest)
------------------------------------
1. Open your local app in browser
2. Open DevTools (F12) → Console
3. Paste and run this code:

const data = JSON.parse(localStorage.getItem('game-record-data') || '{}');
fetch('https://game-record-backend.onrender.com/api/app-data/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'default', data: data })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);

Method 2: Command Line
-----------------------
1. Export localStorage data to a file
2. Run: node scripts/upload-localStorage-data.js <data-file.json>

Environment Variables:
  API_URL - Backend API URL (default: https://game-record-backend.onrender.com/api)
  USER_ID - User ID (default: default)
`);
}

