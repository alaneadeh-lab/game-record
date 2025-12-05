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
    try {
      const userId = import.meta.env.VITE_USER_ID || 'default';
      const response = await fetch(`${this.apiUrl}/app-data?userId=${userId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No data found, return default
          console.log('ℹ️ No data found in MongoDB, returning default structure');
          return this.getDefaultAppData();
        }
        throw new Error(`Failed to load app data: ${response.statusText}`);
      }

      const data: AppData = await response.json();
      // Ensure all players have tomatoes field (backward compatibility)
      const playersWithTomatoes = data.allPlayers.map((p: any) => ({
        ...p,
        tomatoes: p.tomatoes ?? 0,
      }));
      console.log('✅ Loaded app data from MongoDB:', data.sets.length, 'sets,', playersWithTomatoes.length, 'players');
      return {
        ...data,
        allPlayers: playersWithTomatoes,
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

