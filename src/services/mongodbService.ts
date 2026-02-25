import type { AppData, PlayerSet } from '../types';
import type { IStorageService } from './storageService';
import { normalizeAppDataOnLoad } from '../utils/appDataNormalize';

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
      
      // Ensure all sets have gameEntries array and winScoreLimit (migration default 50)
      sets = sets.map(set => ({
        ...set,
        gameEntries: Array.isArray(set.gameEntries) ? set.gameEntries : [],
        winScoreLimit: typeof set.winScoreLimit === 'number' && set.winScoreLimit >= 1 && set.winScoreLimit <= 9999
          ? Math.floor(set.winScoreLimit)
          : 50,
        winScoreLabel: set.winScoreLabel,
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
      
      // Return normalized AppData (sets, NOT playerSets) and apply load migrations
      let normalizedData: AppData = {
        allPlayers: playersWithTomatoes,
        sets: filteredSets,
        deletedSetIds: deletedSetIds,
        dataVersion: typeof rawData.dataVersion === 'number' ? rawData.dataVersion : 0,
        legacySetWinsByPlayerId:
          rawData.legacySetWinsByPlayerId && typeof rawData.legacySetWinsByPlayerId === 'object'
            ? rawData.legacySetWinsByPlayerId
            : undefined,
      };
      normalizedData = normalizeAppDataOnLoad(normalizedData);
      return normalizedData;
    } catch (error) {
      console.error('❌ Error loading app data from MongoDB:', error);
      // Fallback to default data
      return this.getDefaultAppData();
    }
  }

  async saveAppData(data: AppData, options?: { allowDestructive?: boolean }): Promise<{ ok: boolean; code?: string; serverVersion?: number; message?: string }> {
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
          winScoreLimit: typeof set.winScoreLimit === 'number' && set.winScoreLimit >= 1 && set.winScoreLimit <= 9999
            ? Math.floor(set.winScoreLimit)
            : 50,
          winScoreLabel: set.winScoreLabel,
        })),
        deletedSetIds: Array.isArray(data.deletedSetIds) ? data.deletedSetIds : [],
        dataVersion: typeof data.dataVersion === 'number' ? data.dataVersion : 0,
        legacySetWinsByPlayerId:
          data.legacySetWinsByPlayerId && typeof data.legacySetWinsByPlayerId === 'object'
            ? data.legacySetWinsByPlayerId
            : undefined,
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
      
      const body: { userId: string; data: AppData; allowDestructive?: boolean } = {
        userId,
        data: normalizedData,
      };
      if (options?.allowDestructive === true) {
        body.allowDestructive = true;
      }

      const response = await fetch(`${this.apiUrl}/app-data`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const reason = errorData.reason || errorData.code;
        const serverMessage = errorData.message || errorData.error || response.statusText;

        if (response.status === 409 && reason === 'stale_write_rejected') {
          console.error('🚫 [STALE WRITE] Server rejected stale write:', errorData);
          return {
            ok: false,
            code: 'stale_write_rejected',
            serverVersion: errorData.existingDataVersion ?? errorData.serverDataVersion,
            message: serverMessage || 'Write rejected: Incoming data version is older than existing version',
          };
        }
        if (response.status === 409 && reason === 'destructive_write_blocked') {
          console.error('🚫 [DESTRUCTIVE] Server blocked destructive write:', errorData);
          return {
            ok: false,
            code: 'destructive_write_blocked',
            message: serverMessage || 'Write blocked: This would reduce game entries. Use explicit delete or allowDestructive.',
          };
        }
        if (response.status === 409 && reason === 'blocked_blank_overwrite') {
          console.error('🚫 [BLOCKED] Server prevented blank template overwrite:', errorData);
          return {
            ok: false,
            code: 'blocked_blank_overwrite',
            message: serverMessage || 'Cannot overwrite existing game history with blank template',
          };
        }
        return {
          ok: false,
          code: 'save_failed',
          message: serverMessage || `Save failed (${response.status})`,
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

  async deleteGameEntry(setId: string, entryId: string): Promise<{ ok: boolean; code?: string; message?: string; totalGameEntries?: number; dataVersion?: number }> {
    const userId = import.meta.env.VITE_USER_ID || 'default';
    const url = `${this.apiUrl}/app-data/sets/${encodeURIComponent(setId)}/entries/${encodeURIComponent(entryId)}?userId=${encodeURIComponent(userId)}`;
    try {
      console.log('🗑️ [DELETE ENTRY] Client:', { setId, entryId });
      const response = await fetch(url, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const code = data.code || (response.status === 404 ? 'not_found' : 'delete_failed');
        const message = data.error || data.message || (response.status === 404 ? 'Set or entry not found' : `Delete failed (${response.status})`);
        return { ok: false, code, message };
      }
      return {
        ok: true,
        totalGameEntries: data.totalGameEntries,
        dataVersion: data.dataVersion,
      };
    } catch (error) {
      console.error('❌ Failed to delete game entry:', error);
      return {
        ok: false,
        code: 'delete_error',
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

