# Migrate localStorage Data to MongoDB

## Quick Method: Browser Console

1. **Open your local app** (the one with data in localStorage)
   - Usually: `http://localhost:5200`

2. **Open Browser DevTools** (F12) → Console tab

3. **Copy and paste this code:**

```javascript
// Get data from localStorage
const localStorageData = localStorage.getItem('game-record-data');

if (!localStorageData) {
  console.error('❌ No data found in localStorage');
} else {
  // Parse the data
  let data = JSON.parse(localStorageData);
  
  // Handle old format (array of sets) or new format (AppData)
  let appData;
  if (Array.isArray(data)) {
    // Old format - convert to new format
    console.log('🔄 Converting old format...');
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
    console.error('❌ Invalid data format');
    appData = null;
  }
  
  if (appData) {
    console.log(`📤 Uploading: ${appData.allPlayers.length} players, ${appData.sets.length} sets`);
    
    // Upload to backend
    fetch('https://game-record-backend.onrender.com/api/app-data/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'default',
        data: appData,
      }),
    })
    .then(response => response.json())
    .then(result => {
      console.log('✅ Upload successful!');
      console.log('Result:', result);
      alert('✅ Data uploaded successfully! Refresh your production app to see it.');
    })
    .catch(error => {
      console.error('❌ Upload failed:', error);
      alert('❌ Upload failed. Check console for details.');
    });
  }
}
```

4. **Press Enter** to run the code

5. **Wait for success message** - you should see:
   ```
   ✅ Upload successful!
   Result: { success: true, message: "Data uploaded successfully", ... }
   ```

6. **Refresh your production app** (`game-record-jet.vercel.app`) - your data should now be there!

## Alternative: Command Line Method

1. **Export localStorage data:**
   - Open browser console
   - Run: `localStorage.getItem('game-record-data')`
   - Copy the JSON output
   - Save to a file: `my-data.json`

2. **Upload via script:**
   ```bash
   node scripts/upload-localStorage-data.js my-data.json
   ```

## Verify Upload

After uploading, test that it worked:

```bash
curl https://game-record-backend.onrender.com/api/app-data?userId=default
```

You should see your players and sets in the response.

## Troubleshooting

**Error: "Database not connected"**
- Check Render logs to ensure MongoDB is connected
- Verify `MONGODB_URI` is set correctly in Render

**Error: "Invalid data format"**
- Make sure the data has `allPlayers` and `sets` arrays
- The script handles both old and new formats automatically

**CORS Error:**
- Make sure `FRONTEND_URL` in Render is set to your Vercel URL
- The upload endpoint should work from any origin (CORS is configured)

**Data not showing in production:**
- Wait a few seconds for the upload to complete
- Refresh the production app
- Check browser console for any errors

