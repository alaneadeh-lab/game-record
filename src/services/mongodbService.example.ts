/**
 * MongoDB Storage Service Example
 * 
 * To use MongoDB instead of localStorage:
 * 
 * 1. Create a backend API (Node.js/Express, Python/Flask, etc.)
 * 2. Implement endpoints:
 *    - GET /api/player-sets - returns all player sets
 *    - PUT /api/player-sets - saves all player sets
 * 
 * 3. Uncomment and implement this class:
 */

// Uncomment when implementing MongoDB service:
// import type { PlayerSet } from '../types';
// import type { IStorageService } from './storageService';

/*
export class MongoDBService implements IStorageService {
  private apiUrl: string;

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || process.env.REACT_APP_API_URL || 'http://localhost:5200/api';
  }

  async loadPlayerSets(): Promise<PlayerSet[]> {
    try {
      const response = await fetch(`${this.apiUrl}/player-sets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Loaded player sets from MongoDB:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Error loading player sets from MongoDB:', error);
      throw error;
    }
  }

  async savePlayerSets(sets: PlayerSet[]): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/player-sets`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sets),
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.statusText}`);
      }

      console.log('✅ Saved player sets to MongoDB:', sets.length, 'sets');
      console.log('📊 Data preview:', {
        sets: sets.length,
        totalGames: sets.reduce((sum, set) => sum + set.gameEntries.length, 0),
        totalPlayers: sets.reduce((sum, set) => sum + set.players.length, 0),
      });
    } catch (error) {
      console.error('❌ Error saving player sets to MongoDB:', error);
      throw error;
    }
  }
}
*/

/**
 * Example Backend API (Node.js/Express):
 * 
 * ```javascript
 * const express = require('express');
 * const { MongoClient } = require('mongodb');
 * const app = express();
 * 
 * app.use(express.json());
 * 
 * const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
 * const client = new MongoClient(uri);
 * 
 * app.get('/api/player-sets', async (req, res) => {
 *   try {
 *     await client.connect();
 *     const db = client.db('game-record');
 *     const collection = db.collection('player-sets');
 *     const sets = await collection.find({}).toArray();
 *     res.json(sets);
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 * 
 * app.put('/api/player-sets', async (req, res) => {
 *   try {
 *     await client.connect();
 *     const db = client.db('game-record');
 *     const collection = db.collection('player-sets');
 *     await collection.deleteMany({});
 *     await collection.insertMany(req.body);
 *     res.json({ success: true });
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 * 
 * app.listen(5200, () => {
 *   console.log('Server running on http://localhost:5200');
 * });
 * ```
 * 
 * Then in storageService.ts, change:
 * ```typescript
 * export const storageService: IStorageService = new MongoDBService();
 * ```
 */

