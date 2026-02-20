import type { PlayerSet, Player, AppData } from '../types';

/**
 * Storage service interface - makes it easy to swap between localStorage and MongoDB
 * To connect MongoDB, just implement this interface and swap the service in App.tsx
 */
export interface IStorageService {
  loadAppData(): Promise<AppData>;
  saveAppData(data: AppData): Promise<void>;
}

/**
 * LocalStorage implementation
 */
class LocalStorageService implements IStorageService {
  private readonly STORAGE_KEY = 'game-record-data';

  async loadAppData(): Promise<AppData> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // NORMALIZE: Convert legacy playerSets to sets if present
        let sets: any[] = [];
        if (Array.isArray(parsed.sets)) {
          sets = parsed.sets;
        } else if (Array.isArray(parsed.playerSets)) {
          console.log('🔄 [NORMALIZE] Converting legacy playerSets to sets in localStorage');
          sets = parsed.playerSets;
        }
        
        // Check if this is the new format (has allPlayers and sets)
        if (parsed.allPlayers && Array.isArray(parsed.allPlayers) && sets.length >= 0) {
          console.log('✅ Loaded app data from localStorage:', sets.length, 'sets,', parsed.allPlayers.length, 'players');
          // Ensure all players have tomatoes field (backward compatibility)
          const playersWithTomatoes = parsed.allPlayers.map((p: any) => ({
            ...p,
            tomatoes: p.tomatoes ?? 0,
          }));
          
          // Ensure all sets have gameEntries array
          const normalizedSets = sets.map((set: any) => ({
            ...set,
            gameEntries: Array.isArray(set.gameEntries) ? set.gameEntries : [],
          }));
          
          // Filter deleted sets on load
          const deletedSetIds = Array.isArray(parsed.deletedSetIds) ? parsed.deletedSetIds : [];
          const filteredSets = normalizedSets.filter((set: any) => !deletedSetIds.includes(set.id));
          
          console.log('🗑️ [DELETE] Filtering deleted sets on load (localStorage):', {
            deletedSetIdsCount: deletedSetIds.length,
            deletedSetIds: deletedSetIds.slice(0, 5),
            setsBeforeFilter: normalizedSets.length,
            setsAfterFilter: filteredSets.length,
          });
          
          // Validate that we have actual data, not empty arrays
          if (playersWithTomatoes.length > 0 || filteredSets.length > 0) {
            return {
              allPlayers: playersWithTomatoes,
              sets: filteredSets, // Return sets, NOT playerSets (filtered)
              deletedSetIds: deletedSetIds,
              dataVersion: typeof parsed.dataVersion === 'number' ? parsed.dataVersion : 1,
            };
          }
        }
        
        // Migration: old format (just sets with players array)
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].players) {
          console.log('🔄 Migrating from old format to new format...');
          return this.migrateOldFormat(parsed);
        }
      }
    } catch (error) {
      console.error('❌ Error loading app data from localStorage:', error);
    }
    
    // Only return default if truly no data exists
    console.log('ℹ️ No stored data found, returning default structure');
    return this.getDefaultAppData();
  }

  async saveAppData(data: AppData): Promise<void> {
    // NORMALIZE: Ensure canonical structure (sets, NOT playerSets)
    const normalizedData: AppData = {
      allPlayers: data.allPlayers,
      sets: data.sets.map(set => ({
        id: set.id,
        name: set.name,
        playerIds: Array.isArray(set.playerIds) ? set.playerIds : [],
        gameEntries: Array.isArray(set.gameEntries) ? set.gameEntries : [],
      })),
    };
    
    try {
      const serialized = JSON.stringify(normalizedData);
      const sizeInMB = (serialized.length / (1024 * 1024)).toFixed(2);
      
      // Warn if data is getting large
      if (serialized.length > 3 * 1024 * 1024) { // 3MB
        console.warn(`⚠️ Data size is ${sizeInMB}MB, approaching localStorage limit`);
      }
      
      localStorage.setItem(this.STORAGE_KEY, serialized);
      console.log(`✅ Saved app data (${sizeInMB}MB)`);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error("❌ localStorage quota exceeded! Data is too large to save.");
        console.error("💡 Suggestions:");
        console.error("   - Remove some player photos (they take up the most space)");
        console.error("   - Use smaller images for player photos");
        console.error("   - Clear browser cache and try again");
        
        // Try to save without photos as a last resort
        const dataWithoutPhotos: AppData = {
          allPlayers: normalizedData.allPlayers.map((p: any) => ({ ...p, photo: undefined })),
          sets: normalizedData.sets,
        };
        
        try {
          const serializedWithoutPhotos = JSON.stringify(dataWithoutPhotos);
          localStorage.setItem(this.STORAGE_KEY, serializedWithoutPhotos);
          console.warn("⚠️ Saved data without photos to prevent data loss");
          alert("⚠️ Storage quota exceeded! Your data was saved but player photos were removed to free up space. Please use smaller images.");
        } catch (retryError) {
          console.error("❌ Failed to save even without photos:", retryError);
          alert("❌ Storage quota exceeded! Unable to save data. Please clear browser storage or use smaller images.");
        }
      } else {
        console.error("❌ Failed to save app data:", error);
        throw error;
      }
    }
  }

  private migrateOldFormat(oldSets: any[]): AppData {
    // Extract all unique players from all sets
    const allPlayersMap = new Map<string, Player>();
    
    oldSets.forEach(set => {
      if (set.players && Array.isArray(set.players)) {
        set.players.forEach((player: Player) => {
          if (!allPlayersMap.has(player.id)) {
            allPlayersMap.set(player.id, { ...player });
          }
        });
      }
    });

    const allPlayers = Array.from(allPlayersMap.values());

    // Convert sets to use playerIds
    const newSets: PlayerSet[] = oldSets.map(set => ({
      id: set.id,
      name: set.name,
      playerIds: set.players ? set.players.map((p: Player) => p.id) : [],
      gameEntries: set.gameEntries || [],
    }));

    const migrated: AppData = {
      allPlayers,
      sets: newSets,
    };

    // Save migrated data
    this.saveAppData(migrated).catch(console.error);
    
    console.log('✅ Migration complete:', allPlayers.length, 'players,', newSets.length, 'sets');
    return migrated;
  }

  private getDefaultAppData(): AppData {
    const defaultPlayers: Player[] = [
      { id: '1', name: 'Player 1', points: 0, fatts: 0, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, tomatoes: 0 },
      { id: '2', name: 'Player 2', points: 0, fatts: 0, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, tomatoes: 0 },
      { id: '3', name: 'Player 3', points: 0, fatts: 0, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, tomatoes: 0 },
      { id: '4', name: 'Player 4', points: 0, fatts: 0, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, tomatoes: 0 },
    ];

    return {
      allPlayers: defaultPlayers,
      sets: [{
        id: Date.now().toString(),
        name: 'Set 1',
        playerIds: defaultPlayers.map(p => p.id),
        gameEntries: [],
      }],
    };
  }
}

/**
 * MongoDB implementation (example - ready to implement)
 * 
 * class MongoDBService implements IStorageService {
 *   private apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5200/api';
 * 
 *   async loadAppData(): Promise<AppData> {
 *     const response = await fetch(`${this.apiUrl}/app-data`);
 *     if (!response.ok) throw new Error('Failed to load app data');
 *     return response.json();
 *   }
 * 
 *   async saveAppData(data: AppData): Promise<void> {
 *     const response = await fetch(`${this.apiUrl}/app-data`, {
 *       method: 'PUT',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify(data),
 *     });
 *     if (!response.ok) throw new Error('Failed to save app data');
 *   }
 * }
 */

// Export the currently active storage service
// Automatically uses MongoDB if VITE_API_URL is set, otherwise uses localStorage
import MongoDBService from './mongodbService';

const useMongoDB = import.meta.env.VITE_API_URL !== undefined;

// ENVIRONMENT CHECK: Warn if MongoDB is expected but not configured
if (typeof window !== 'undefined') {
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  if (isProduction && !useMongoDB) {
    console.warn('⚠️ [ENVIRONMENT] VITE_API_URL is missing in production! Cloud save is disabled. Using local device storage only.');
    // Show visible warning banner
    setTimeout(() => {
      const banner = document.createElement('div');
      banner.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #f59e0b; color: white; padding: 12px; text-align: center; z-index: 9999; font-weight: bold;';
      banner.textContent = '⚠️ Cloud save disabled (missing API URL). Using local device only.';
      document.body.appendChild(banner);
      setTimeout(() => banner.remove(), 10000);
    }, 1000);
  }
}

export const storageService: IStorageService = useMongoDB 
  ? new MongoDBService()
  : new LocalStorageService();

/**
 * Diagnostic function to check localStorage availability and status
 */
export const checkLocalStorageStatus = (): {
  available: boolean;
  working: boolean;
  quotaInfo?: { used: number; remaining: number; total: number };
  error?: string;
} => {
  const result = {
    available: typeof localStorage !== 'undefined',
    working: false,
    quotaInfo: undefined as { used: number; remaining: number; total: number } | undefined,
    error: undefined as string | undefined,
  };

  if (!result.available) {
    result.error = 'localStorage is not available in this environment';
    return result;
  }

  try {
    // Test write/read
    const testKey = '__localStorage_diagnostic_test__';
    const testValue = 'test';
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    if (retrieved === testValue) {
      result.working = true;
    } else {
      result.error = 'localStorage read/write test failed';
    }

    // Try to estimate quota (this is approximate)
    try {
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          used += localStorage.getItem(key)?.length || 0;
        }
      }
      // Most browsers have ~5-10MB limit, but we can't know exact limit
      result.quotaInfo = {
        used,
        remaining: 5 * 1024 * 1024 - used, // Assume 5MB limit
        total: 5 * 1024 * 1024,
      };
    } catch (e) {
      // Quota estimation failed, that's okay
    }
  } catch (error) {
    result.working = false;
    if (error instanceof DOMException) {
      if (error.name === 'QuotaExceededError') {
        result.error = 'localStorage quota exceeded';
      } else if (error.name === 'SecurityError') {
        result.error = 'localStorage access denied (check browser settings)';
      } else {
        result.error = `localStorage error: ${error.name}`;
      }
    } else {
      result.error = `localStorage error: ${error}`;
    }
  }

  return result;
};

// Legacy helper for backward compatibility (deprecated)
export const getDefaultPlayerSet = (): PlayerSet => ({
  id: Date.now().toString(),
  name: 'Set 1',
  playerIds: ['1', '2', '3', '4'],
  gameEntries: [],
});
