import type { Player, GameEntry, MedalType, AppData } from '../types';

/** Default win score limit for sets created before this field existed. */
export const DEFAULT_WIN_SCORE_LIMIT = 50;

/** Safe win score limit for a set (1–9999). */
export function getWinScoreLimit(set: { winScoreLimit?: number }): number {
  const n = set.winScoreLimit;
  if (typeof n === 'number' && n >= 1 && n <= 9999) return Math.floor(n);
  return DEFAULT_WIN_SCORE_LIMIT;
}

export function calculateMedalPoints(player: Player): number {
  return (player.goldMedals * 3) +
         (player.silverMedals * 2) +
         (player.bronzeMedals * 1);
}

export const calculateMedals = (playerScores: { playerId: string; score: number }[]): Record<string, MedalType> => {
  // Sort by score (lowest is winner)
  const sorted = [...playerScores].sort((a, b) => a.score - b.score);
  const medals: Record<string, MedalType> = {};
  
  if (sorted.length > 0) medals[sorted[0].playerId] = 'gold';
  if (sorted.length > 1) medals[sorted[1].playerId] = 'silver';
  if (sorted.length > 2) medals[sorted[2].playerId] = 'bronze';
  
  return medals;
};

export function recalculateMedals(players: Player[], gameEntries: GameEntry[]): Player[] {
  // Reset all medals and tomatoes first
  const medalCounts = players.map(p => ({
    id: p.id,
    gold: 0,
    silver: 0,
    bronze: 0,
    tomatoes: 0
  }));

  for (const game of gameEntries) {
    // Sort players by score ASC
    const sorted = [...game.playerScores].sort((a, b) => a.score - b.score);

    if (sorted[0]) {
      const g = medalCounts.find(m => m.id === sorted[0].playerId);
      if (g) g.gold += 1;
    }
    if (sorted[1]) {
      const s = medalCounts.find(m => m.id === sorted[1].playerId);
      if (s) s.silver += 1;
    }
    if (sorted[2]) {
      const b = medalCounts.find(m => m.id === sorted[2].playerId);
      if (b) b.bronze += 1;
    }
    if (sorted.length >= 4 && sorted[3]) {
      // 4th place gets a tomato (only if there are at least 4 players)
      const t = medalCounts.find(m => m.id === sorted[3].playerId);
      if (t) {
        t.tomatoes += 1;
        // Removed console.log to reduce console noise when processing many game entries
      }
    }
  }

  // Assign medals and tomatoes back to players and recalculate points based on medals
  return players.map(p => {
    const m = medalCounts.find(mc => mc.id === p.id);
    const updatedPlayer = {
      ...p,
      goldMedals: m?.gold || 0,
      silverMedals: m?.silver || 0,
      bronzeMedals: m?.bronze || 0,
      tomatoes: m?.tomatoes || 0
    };
    // Update points based on medal conversion (tomatoes don't add to points)
    updatedPlayer.points = calculateMedalPoints(updatedPlayer);
    return updatedPlayer;
  });
}

export const applyGameEntry = (players: Player[], entry: GameEntry): Player[] => {
  return players.map(player => {
    const playerEntry = entry.playerScores.find(ps => ps.playerId === player.id);
    if (!playerEntry) return player;
    
    return {
      ...player,
      fatts: player.fatts + playerEntry.fatt,
    };
  });
};

export const removeGameEntry = (players: Player[], entry: GameEntry): Player[] => {
  return players.map(player => {
    const playerEntry = entry.playerScores.find(ps => ps.playerId === player.id);
    if (!playerEntry) return player;
    
    return {
      ...player,
      fatts: Math.max(0, player.fatts - playerEntry.fatt),
    };
  });
};

export const getPlayerRank = (players: Player[]): Record<string, number> => {
  // Rank by medal points first (higher is better), then by gold medals, then silver
  const sorted = [...players].sort((a, b) => {
    const aMedalScore = calculateMedalPoints(a);
    const bMedalScore = calculateMedalPoints(b);
    
    // First: compare medal points (higher is better)
    if (aMedalScore !== bMedalScore) {
      return bMedalScore - aMedalScore;
    }
    
    // Tiebreaker 1: more gold medals
    if (a.goldMedals !== b.goldMedals) {
      return b.goldMedals - a.goldMedals;
    }
    
    // Tiebreaker 2: more silver medals
    if (a.silverMedals !== b.silverMedals) {
      return b.silverMedals - a.silverMedals;
    }
    
    // If still tied, they have the same rank
    return 0;
  });
  
  const ranks: Record<string, number> = {};
  sorted.forEach((player, index) => {
    ranks[player.id] = index + 1;
  });
  
  return ranks;
};

/**
 * Recalculate medals for a player across all sets they belong to
 * This aggregates medals from all sets the player is in
 */
export function recalculateMedalsForPlayerAcrossAllSets(
  playerId: string,
  allPlayers: Player[],
  allSets: Array<{ playerIds: string[]; gameEntries: GameEntry[] }>
): Player {
  const player = allPlayers.find(p => p.id === playerId);
  if (!player) {
    throw new Error(`Player ${playerId} not found`);
  }

  // Find all sets this player belongs to
  const playerSets = allSets.filter(set => set.playerIds.includes(playerId));

  // Reset medal and tomato counts
  let totalGold = 0;
  let totalSilver = 0;
  let totalBronze = 0;
  let totalTomatoes = 0;

  // Calculate medals for each set
  for (const set of playerSets) {
    // Get all players in this set
    const setPlayers = set.playerIds
      .map(id => allPlayers.find(p => p.id === id))
      .filter((p): p is Player => p !== undefined);

    // Recalculate medals for this set
    const setMedals = recalculateMedals(setPlayers, set.gameEntries);
    const playerMedals = setMedals.find(p => p.id === playerId);
    
    if (playerMedals) {
      totalGold += playerMedals.goldMedals;
      totalSilver += playerMedals.silverMedals;
      totalBronze += playerMedals.bronzeMedals;
      totalTomatoes += playerMedals.tomatoes || 0;
    }
  }

  // Update player with aggregated medals and tomatoes
  const updatedPlayer = {
    ...player,
    goldMedals: totalGold,
    silverMedals: totalSilver,
    bronzeMedals: totalBronze,
    tomatoes: totalTomatoes,
  };
  updatedPlayer.points = calculateMedalPoints(updatedPlayer);

  return updatedPlayer;
}

/**
 * Calculate player stats (medals, fatts, points) for a specific set
 * Stats are exclusive to this set and not shared across sets
 */
export function calculatePlayerStatsForSet(
  playerIds: string[],
  allPlayers: Player[],
  gameEntries: GameEntry[]
): Player[] {
  // Get players in this set (base player info only, no stats)
  const setPlayers = playerIds
    .map(id => {
      const player = allPlayers.find(p => p.id === id);
      if (!player) return null;
      // Return player with stats reset to 0 (stats are per-set)
      return {
        ...player,
        points: 0,
        fatts: 0,
        goldMedals: 0,
        silverMedals: 0,
        bronzeMedals: 0,
        tomatoes: 0,
      };
    })
    .filter((p): p is Player => p !== null);

  if (setPlayers.length === 0) return [];

  // Calculate medals from this set's game entries only
  const playersWithMedals = recalculateMedals(setPlayers, gameEntries);

  // Calculate fatts from this set's game entries only
  let playersWithFatts = setPlayers.map(p => ({ ...p, fatts: 0 }));
  for (const gameEntry of gameEntries) {
    playersWithFatts = applyGameEntry(playersWithFatts, gameEntry);
  }

  // Merge medals and fatts for each player
  return playersWithMedals.map(player => {
    const playerWithFatts = playersWithFatts.find(p => p.id === player.id);
    return {
      ...player,
      fatts: playerWithFatts?.fatts || 0,
    };
  });
}

type SetForStars = {
  id?: string;
  playerIds?: string[];
  gameEntries?: { playerScores?: { playerId: string; score: number }[] }[];
  winScoreLimit?: number;
};

/**
 * Winner ids for a set that has reached its win limit.
 * Returns null while the set is still short of the limit.
 * Each game awards podium points (3 gold, 2 silver, 1 bronze).
 */
export function getCompletedSetWinnerIds(set: SetForStars): string[] | null {
  const gameEntries = Array.isArray(set.gameEntries) ? set.gameEntries : [];
  if (gameEntries.length === 0) return null;
  const winLimit = getWinScoreLimit(set);
  const playerIds = Array.isArray(set.playerIds) ? set.playerIds : [];
  const podiumPoints = Object.fromEntries(playerIds.map((id) => [id, 0])) as Record<string, number>;

  for (const game of gameEntries) {
    const scores = Array.isArray(game?.playerScores) ? game.playerScores : [];
    const rankedScores = [...scores]
      .filter((score) => playerIds.includes(score.playerId))
      .sort((a, b) => a.score - b.score);
    if (rankedScores[0]) podiumPoints[rankedScores[0].playerId] += 3;
    if (rankedScores[1]) podiumPoints[rankedScores[1].playerId] += 2;
    if (rankedScores[2]) podiumPoints[rankedScores[2].playerId] += 1;
  }

  const leadingPoints = Math.max(0, ...Object.values(podiumPoints));
  if (leadingPoints < winLimit) return null;
  const winnerIds = playerIds.filter((id) => podiumPoints[id] === leadingPoints);
  return winnerIds.length > 0 ? winnerIds : null;
}

/** Keep only valid locked winner lists. Does not drop known set ids. */
export function readSolidifiedSetWins(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const solidified: Record<string, string[]> = {};
  for (const [setId, winners] of Object.entries(value)) {
    if (!setId || !Array.isArray(winners)) continue;
    const winnerIds = [...new Set(winners.filter((id): id is string => typeof id === 'string' && id.length > 0))];
    if (winnerIds.length > 0) solidified[setId] = winnerIds;
  }
  return solidified;
}

/**
 * Lock a star the first time a set reaches its win limit.
 * Existing entries are kept as-is, including entries whose set is no longer present.
 */
export function solidifySetWins(existing: unknown, sets: SetForStars[] | undefined): Record<string, string[]> {
  const solidified = readSolidifiedSetWins(existing);
  for (const set of Array.isArray(sets) ? sets : []) {
    if (!set?.id || solidified[set.id]) continue;
    const winnerIds = getCompletedSetWinnerIds(set);
    if (winnerIds) solidified[set.id] = winnerIds;
  }
  return solidified;
}

export function countSolidifiedSetWins(solidified: Record<string, string[]>): Record<string, number> {
  const wins: Record<string, number> = {};
  for (const winnerIds of Object.values(solidified)) {
    for (const id of winnerIds) {
      wins[id] = (wins[id] ?? 0) + 1;
    }
  }
  return wins;
}

/**
 * Set wins per player.
 * A star is locked the first time a set reaches its win limit and is never removed,
 * including when that set or its games are deleted.
 */
export function getSetWinsByPlayerId(appData: AppData): Record<string, number> {
  return countSolidifiedSetWins(solidifySetWins(appData.solidifiedSetWinsBySetId, appData.sets));
}

