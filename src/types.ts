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
}

export interface AppData {
  allPlayers: Player[];
  sets: PlayerSet[];
}

export type MedalType = 'gold' | 'silver' | 'bronze';


