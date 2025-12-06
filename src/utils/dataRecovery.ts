/**
 * Data Recovery Utility
 * Helps recover data from localStorage when switching to MongoDB
 */

import type { AppData } from '../types';

const STORAGE_KEY = 'game-record-data';

/**
 * Check if there's data in localStorage
 */
export function checkLocalStorageData(): { exists: boolean; data?: AppData; error?: string } {
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
      return {
        exists: true,
        data: {
          allPlayers: parsed.allPlayers,
          sets: parsed.sets,
        },
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
export async function uploadLocalStorageToMongoDB(apiUrl: string, userId: string = 'default'): Promise<{ success: boolean; error?: string }> {
  try {
    const checkResult = checkLocalStorageData();
    
    if (!checkResult.exists || !checkResult.data) {
      return {
        success: false,
        error: 'No data found in localStorage',
      };
    }

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

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

