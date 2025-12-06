/**
 * Data Recovery Utility
 * Helps recover data from localStorage when switching to MongoDB
 */

import type { AppData } from '../types';

const STORAGE_KEY = 'game-record-data';

/**
 * Check if there's data in localStorage
 */
export function checkLocalStorageData(): { exists: boolean; data?: AppData; error?: string; stats?: any } {
  try {
    if (typeof localStorage === 'undefined') {
      return { exists: false, error: 'localStorage not available' };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { exists: false };
    }

    const parsed = JSON.parse(stored);
    
    // Check if this is the new format (has allPlayers and sets)
    if (parsed.allPlayers && Array.isArray(parsed.allPlayers) && parsed.sets && Array.isArray(parsed.sets)) {
      // Calculate stats for debugging
      const totalGames = parsed.sets.reduce((sum: number, set: any) => sum + (set.gameEntries?.length || 0), 0);
      const playersWithPhotos = parsed.allPlayers.filter((p: any) => p.photo).length;
      const playersWithNames = parsed.allPlayers.filter((p: any) => p.name && p.name !== 'Player 1' && p.name !== 'Player 2' && p.name !== 'Player 3' && p.name !== 'Player 4').length;
      
      const stats = {
        players: parsed.allPlayers.length,
        playersWithPhotos,
        playersWithNames,
        sets: parsed.sets.length,
        totalGames,
        gameEntriesPerSet: parsed.sets.map((s: any) => ({ name: s.name, games: s.gameEntries?.length || 0 })),
      };
      
      console.log('📊 localStorage data stats:', stats);
      
      return {
        exists: true,
        data: {
          allPlayers: parsed.allPlayers,
          sets: parsed.sets,
        },
        stats,
      };
    }
    
    // Check for old format (just an array of sets)
    if (Array.isArray(parsed) && parsed.length > 0) {
      // This is old format - would need migration
      return {
        exists: true,
        data: {
          allPlayers: [],
          sets: [],
        },
        error: 'Old format detected - needs migration',
      };
    }

    return { exists: false };
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload localStorage data to MongoDB via API
 */
export async function uploadLocalStorageToMongoDB(apiUrl: string, userId: string = 'default'): Promise<{ success: boolean; error?: string; stats?: any }> {
  try {
    const checkResult = checkLocalStorageData();
    
    if (!checkResult.exists || !checkResult.data) {
      return {
        success: false,
        error: 'No data found in localStorage',
      };
    }

    // Log what we're about to upload
    console.log('📤 Uploading to MongoDB:', {
      players: checkResult.data.allPlayers.length,
      sets: checkResult.data.sets.length,
      gameEntries: checkResult.data.sets.reduce((sum: number, set: any) => sum + (set.gameEntries?.length || 0), 0),
      playerDetails: checkResult.data.allPlayers.map((p: any) => ({
        id: p.id,
        name: p.name,
        hasPhoto: !!p.photo,
        photoLength: p.photo?.length || 0,
      })),
      setDetails: checkResult.data.sets.map((s: any) => ({
        id: s.id,
        name: s.name,
        playerIds: s.playerIds?.length || 0,
        gameEntries: s.gameEntries?.length || 0,
      })),
    });

    const response = await fetch(`${apiUrl}/app-data/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        data: checkResult.data,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      return {
        success: false,
        error: errorData.error || response.statusText,
      };
    }

    const responseData = await response.json();
    console.log('✅ Upload successful:', responseData);
    
    return { 
      success: true,
      stats: checkResult.stats || responseData.stats,
    };
  } catch (error) {
    console.error('❌ Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

