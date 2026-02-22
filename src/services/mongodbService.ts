import type { AppData, PlayerSet } from '../types';
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

      const rawData: any = await response.json();
      
      console.log('📦 Raw data received from MongoDB:', {
        hasData: !!rawData,
        dataType: typeof rawData,
        keys: rawData ? Object.keys(rawData) : [],
        allPlayersType: rawData?.allPlayers ? typeof rawData.allPlayers : 'undefined',
        setsType: rawData?.sets ? typeof rawData.sets : 'undefined',
        playerSetsType: rawData?.playerSets ? typeof rawData.playerSets : 'undefined',
        allPlayersLength: Array.isArray(rawData?.allPlayers) ? rawData.allPlayers.length : 'not array',
        setsLength: Array.isArray(rawData?.sets) ? rawData.sets.length : 'not array',
        playerSetsLength: Array.isArray(rawData?.playerSets) ? rawData.playerSets.length : 'not array',
      });
      
      // Validate data structure
      if (!rawData || typeof rawData !== 'object') {
        console.error('❌ Invalid data structure:', rawData);
        throw new Error('Invalid data structure received from MongoDB');
      }
      
      // NORMALIZE: Convert legacy playerSets to sets if present
      let sets: PlayerSet[] = [];
      if (Array.isArray(rawData.sets)) {
        sets = rawData.sets;
      } else if (Array.isArray(rawData.playerSets)) {
        console.log('🔄 [NORMALIZE] Converting legacy playerSets to sets');
        sets = rawData.playerSets;
      }
      
      // Ensure all sets have gameEntries array
      sets = sets.map(set => ({
        ...set,
        gameEntries: Array.isArray(set.gameEntries) ? set.gameEntries : [],
      }));
      
      // Ensure allPlayers is an array
      const allPlayers = Array.isArray(rawData.allPlayers) ? rawData.allPlayers : [];
      
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
        playersSample: allPlayers.slice(0, 2).map((p: any) => ({ id: p.id, name: p.name, points: p.points, fatts: p.fatts })),
        setsDetails: setsDetails,
        totalGameEntries: sets.reduce((sum: number, s: any) => sum + (Array.isArray(s.gameEntries) ? s.gameEntries.length : 0), 0),
      });
      
      // Ensure all players have tomatoes field (backward compatibility)
      const playersWithTomatoes = allPlayers.map((p: any) => ({
        ...p,
        tomatoes: p.tomatoes ?? 0,
      }));
      
      console.log('✅ Loaded app data from MongoDB:', sets.length, 'sets,', playersWithTomatoes.length, 'players');
      
      // Filter deleted sets on load
      const deletedSetIds = Array.isArray(rawData.deletedSetIds) ? rawData.deletedSetIds : [];
      const filteredSets = sets.filter(set => !deletedSetIds.includes(set.id));
      
      console.log('🗑️ [DELETE] Filtering deleted sets on load (MongoDB):', {
        deletedSetIdsCount: deletedSetIds.length,
        deletedSetIds: deletedSetIds.slice(0, 5),
        setsBeforeFilter: sets.length,
        setsAfterFilter: filteredSets.length,
      });
      
      // Return normalized AppData (sets, NOT playerSets)
      // Ensure dataVersion defaults to 0 if missing (not 1, to allow first write)
      const normalizedData: AppData = {
        allPlayers: playersWithTomatoes,
        sets: filteredSets,
        deletedSetIds: deletedSetIds,
        dataVersion: typeof rawData.dataVersion === 'number' ? rawData.dataVersion : 0,
      };
      
      return normalizedData;
    } catch (error) {
      console.error('❌ Error loading app data from MongoDB:', error);
      // Fallback to default data
      return this.getDefaultAppData();
    }
  }

  async saveAppData(data: AppData): Promise<{ ok: boolean; code?: string; serverVersion?: number; message?: string }> {
    try {
      const userId = import.meta.env.VITE_USER_ID || 'default';
      
      // NORMALIZE: Ensure canonical structure (sets, NOT playerSets)
      // Preserve deletedSetIds and dataVersion
      const normalizedData: AppData = {
        allPlayers: data.allPlayers,
        sets: data.sets.map(set => ({
          id: set.id,
          name: set.name,
          playerIds: Array.isArray(set.playerIds) ? set.playerIds : [],
          gameEntries: Array.isArray(set.gameEntries) ? set.gameEntries : [],
        })),
        deletedSetIds: Array.isArray(data.deletedSetIds) ? data.deletedSetIds : [],
        dataVersion: typeof data.dataVersion === 'number' ? data.dataVersion : 0,
      };
      
      // VALIDATION: Ensure gameEntries are present
      const totalGameEntries = normalizedData.sets.reduce((sum, set) => 
        sum + (Array.isArray(set.gameEntries) ? set.gameEntries.length : 0), 0);
      
      // Check if original data had gameEntries but normalized doesn't (shouldn't happen, but safety check)
      const originalTotalGameEntries = data.sets.reduce((sum, set) => 
        sum + (Array.isArray(set.gameEntries) ? set.gameEntries.length : 0), 0);
      
      if (originalTotalGameEntries > 0 && totalGameEntries === 0) {
        console.error('🚫 [BLOCKED] Save prevented: gameEntries lost during normalization!', {
          originalTotalGameEntries,
          normalizedTotalGameEntries: totalGameEntries,
          originalSets: data.sets.map(s => ({
            id: s.id,
            name: s.name,
            gameEntriesCount: Array.isArray(s.gameEntries) ? s.gameEntries.length : 0,
            gameEntriesType: typeof s.gameEntries,
          })),
          normalizedSets: normalizedData.sets.map(s => ({
            id: s.id,
            name: s.name,
            gameEntriesCount: Array.isArray(s.gameEntries) ? s.gameEntries.length : 0,
            gameEntriesType: typeof s.gameEntries,
          })),
        });
        throw new Error('Save blocked: Game entries were lost during normalization. This is a bug.');
      }
      
      const allPlayersWithZeros = normalizedData.allPlayers.filter(p => p.points === 0 && p.fatts === 0 && p.goldMedals === 0 && p.silverMedals === 0 && p.bronzeMedals === 0).length;
      const isBlankTemplate = normalizedData.allPlayers.length > 0 && allPlayersWithZeros === normalizedData.allPlayers.length && totalGameEntries === 0;
      
      console.log('💾 [DIAGNOSTIC] MongoDB save (client-side):', {
        apiUrl: this.apiUrl,
        endpoint: '/app-data',
        method: 'PUT',
        userId: userId,
        queryFilter: { userId },
        payloadKeys: Object.keys({ userId, data: normalizedData }),
        dataKeys: Object.keys(normalizedData),
        hasPlayerSets: 'playerSets' in normalizedData,
        allPlayersCount: normalizedData.allPlayers.length,
        setsCount: normalizedData.sets.length,
        totalGameEntries: totalGameEntries,
        gameEntriesPerSet: normalizedData.sets.map(s => ({
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
          data: normalizedData, // Send normalized data (sets, NOT playerSets)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        
        // Handle stale write rejection (409 Conflict)
        if (response.status === 409 && errorData.reason === 'stale_write_rejected') {
          console.error('🚫 [STALE WRITE] Server rejected stale write:', errorData);
          return {
            ok: false,
            code: 'stale_write_rejected',
            serverVersion: errorData.existingDataVersion,
            message: errorData.message || 'Write rejected: Incoming data version is older than existing version',
          };
        }
        
        // Handle blocked save (409 Conflict - blank template)
        if (response.status === 409 && errorData.reason === 'blocked_blank_overwrite') {
          console.error('🚫 [BLOCKED] Server prevented blank template overwrite:', errorData);
          return {
            ok: false,
            code: 'blocked_blank_overwrite',
            message: errorData.message || 'Cannot overwrite existing game history with blank template',
          };
        }
        
        return {
          ok: false,
          code: 'save_failed',
          message: errorData.error || response.statusText,
        };
      }

      const sizeInMB = (JSON.stringify(data).length / (1024 * 1024)).toFixed(2);
      console.log(`✅ Saved app data to MongoDB (${sizeInMB}MB)`);
      return { ok: true };
    } catch (error) {
      console.error('❌ Failed to save app data to MongoDB:', error);
      return {
        ok: false,
        code: 'save_error',
        message: error instanceof Error ? error.message : String(error),
      };
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

