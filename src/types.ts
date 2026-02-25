export interface Player {
  id: string;
  name: string;
  photo?: string; // URL or base64
  points: number;
  fatts: number;
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
  tomatoes: number; // 4th place finishes
}

export interface GameEntry {
  id: string;
  date: string;
  playerScores: {
    playerId: string;
    score: number;
    fatt: number;
  }[];
}

export interface PlayerSet {
  id: string;
  name: string;
  playerIds: string[]; // References to players in global inventory
  gameEntries: GameEntry[];
  /** Points limit where a game ends for this set. Default 50 if missing (migration). */
  winScoreLimit?: number;
  /** Optional display label (e.g. "حد الفوز") */
  winScoreLabel?: string;
}

export interface AppData {
  allPlayers: Player[];
  sets: PlayerSet[];
  deletedSetIds?: string[]; // Explicitly deleted set IDs (persisted)
  dataVersion?: number; // Monotonically increasing version for stale-save protection
  /** Manual baseline set wins (e.g. pre-app history). Applied once; never double-applied. */
  legacySetWinsByPlayerId?: Record<string, number>;
}

export type MedalType = 'gold' | 'silver' | 'bronze';


