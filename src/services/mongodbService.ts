import type { AppData } from '../types';
import type { IStorageService } from './storageService';

/**
 * MongoDB storage service implementation
 * Connects to backend API for persistent storage
 */
class MongoDBService implements IStorageService {
  private apiUrl: string;

  constructor() {
    // Use environment variable or default to localhost for dev
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5200/api';
  }

  async loadAppData(): Promise<AppData> {
    const userId = import.meta.env.VITE_USER_ID || 'default';
    const timeoutMs = 30000; // 30 second timeout
    
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout: MongoDB fetch took too long')), timeoutMs);
      });

      // Race between fetch and timeout
      const fetchPromise = fetch(`${this.apiUrl}/app-data?userId=${userId}`);
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No data found, return default
          console.log('ℹ️ No data found in MongoDB, returning default structure');
          return this.getDefaultAppData();
        }
        throw new Error(`Failed to load app data: ${response.statusText}`);
      }

      const data: AppData = await response.json();
      
      console.log('📦 Raw data received from MongoDB:', {
        hasData: !!data,
        dataType: typeof data,
        keys: data ? Object.keys(data) : [],
        allPlayersType: data?.allPlayers ? typeof data.allPlayers : 'undefined',
        setsType: data?.sets ? typeof data.sets : 'undefined',
        allPlayersLength: Array.isArray(data?.allPlayers) ? data.allPlayers.length : 'not array',
        setsLength: Array.isArray(data?.sets) ? data.sets.length : 'not array',
      });
      
      // Validate data structure
      if (!data || typeof data !== 'object') {
        console.error('❌ Invalid data structure:', data);
        throw new Error('Invalid data structure received from MongoDB');
      }
      
      // Ensure allPlayers and sets are arrays
      const allPlayers = Array.isArray(data.allPlayers) ? data.allPlayers : [];
      const sets = Array.isArray(data.sets) ? data.sets : [];
      
      // Log detailed information about sets and game entries
      const setsDetails = sets.map((s: any) => ({
        id: s.id,
        name: s.name,
        playerIdsCount: Array.isArray(s.playerIds) ? s.playerIds.length : 0,
        gameEntriesCount: Array.isArray(s.gameEntries) ? s.gameEntries.length : 0,
        gameEntriesSample: Array.isArray(s.gameEntries) && s.gameEntries.length > 0
          ? s.gameEntries.slice(0, 2).map((ge: any) => ({
              id: ge.id,
              date: ge.date,
              playerScoresCount: Array.isArray(ge.playerScores) ? ge.playerScores.length : 0,
              playerScores: Array.isArray(ge.playerScores) ? ge.playerScores.map((ps: any) => ({
                playerId: ps.playerId,
                score: ps.score,
                fatt: ps.fatt,
              })) : [],
            }))
          : [],
      }));
      
      console.log('📊 Processed data:', {
        playersCount: allPlayers.length,
        setsCount: sets.length,
        playersSample: allPlayers.slice(0, 2).map(p => ({ id: p.id, name: p.name, points: p.points, fatts: p.fatts })),
        setsDetails: setsDetails,
        totalGameEntries: sets.reduce((sum: number, s: any) => sum + (Array.isArray(s.gameEntries) ? s.gameEntries.length : 0), 0),
      });
      
      // Ensure all players have tomatoes field (backward compatibility)
      const playersWithTomatoes = allPlayers.map((p: any) => ({
        ...p,
        tomatoes: p.tomatoes ?? 0,
      }));
      
      console.log('✅ Loaded app data from MongoDB:', sets.length, 'sets,', playersWithTomatoes.length, 'players');
      return {
        allPlayers: playersWithTomatoes,
        sets,
      };
    } catch (error) {
      console.error('❌ Error loading app data from MongoDB:', error);
      // Fallback to default data
      return this.getDefaultAppData();
    }
  }

  async saveAppData(data: AppData): Promise<void> {
    try {
      const userId = import.meta.env.VITE_USER_ID || 'default';
      
      // DIAGNOSTIC: Log what we're sending to MongoDB
      const totalGameEntries = data.sets.reduce((sum, set) => sum + (Array.isArray(set.gameEntries) ? set.gameEntries.length : 0), 0);
      const allPlayersWithZeros = data.allPlayers.filter(p => p.points === 0 && p.fatts === 0 && p.goldMedals === 0 && p.silverMedals === 0 && p.bronzeMedals === 0).length;
      const isBlankTemplate = data.allPlayers.length > 0 && allPlayersWithZeros === data.allPlayers.length && totalGameEntries === 0;
      
      console.log('💾 [DIAGNOSTIC] MongoDB save (client-side):', {
        apiUrl: this.apiUrl,
        endpoint: '/app-data',
        method: 'PUT',
        userId: userId,
        queryFilter: { userId },
        payloadKeys: Object.keys({ userId, data }),
        dataKeys: Object.keys(data),
        allPlayersCount: data.allPlayers.length,
        setsCount: data.sets.length,
        totalGameEntries: totalGameEntries,
        gameEntriesPerSet: data.sets.map(s => ({
          setId: s.id,
          setName: s.name,
          gameEntriesCount: Array.isArray(s.gameEntries) ? s.gameEntries.length : 0,
        })),
        allPlayersWithZeros: allPlayersWithZeros,
        isBlankTemplate: isBlankTemplate,
        warning: isBlankTemplate ? '⚠️ WARNING: Saving blank template (all zeros, no entries)!' : null,
      });
      
      const response = await fetch(`${this.apiUrl}/app-data`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        
        // Handle blocked save (409 Conflict)
        if (response.status === 409 && errorData.reason === 'blocked_blank_overwrite') {
          console.error('🚫 [BLOCKED] Server prevented blank template overwrite:', errorData);
          throw new Error(`Save blocked: ${errorData.message || 'Cannot overwrite existing game history with blank template'}`);
        }
        
        throw new Error(`Failed to save app data: ${errorData.error || response.statusText}`);
      }

      const sizeInMB = (JSON.stringify(data).length / (1024 * 1024)).toFixed(2);
      console.log(`✅ Saved app data to MongoDB (${sizeInMB}MB)`);
    } catch (error) {
      console.error('❌ Failed to save app data to MongoDB:', error);
      throw error;
    }
  }

  private getDefaultAppData(): AppData {
    return {
      allPlayers: [],
      sets: [],
    };
  }
}

export default MongoDBService;

