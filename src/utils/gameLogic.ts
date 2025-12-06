import type { Player, GameEntry, MedalType } from '../types';

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
        console.log(`🍅 Tomato awarded to player ${sorted[3].playerId} for 4th place (score: ${sorted[3].score})`);
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
 * Recalculate all medals and fatts for all players across all sets
 * This ensures data consistency on initial load
 */
export function recalculateAllPlayersAcrossAllSets(
  allPlayers: Player[],
  allSets: Array<{ playerIds: string[]; gameEntries: GameEntry[] }>
): Player[] {
  // Create a map to aggregate medals and fatts across all sets
  const playerStatsMap = new Map<string, {
    goldMedals: number;
    silverMedals: number;
    bronzeMedals: number;
    tomatoes: number;
    fatts: number;
  }>();

  // Initialize all players' stats to 0
  allPlayers.forEach(player => {
    playerStatsMap.set(player.id, {
      goldMedals: 0,
      silverMedals: 0,
      bronzeMedals: 0,
      tomatoes: 0,
      fatts: 0,
    });
  });

  // Calculate medals and fatts for each set
  for (const set of allSets) {
    // Get all players in this set
    const setPlayers = set.playerIds
      .map(id => allPlayers.find(p => p.id === id))
      .filter((p): p is Player => p !== undefined);

    if (setPlayers.length === 0) continue;

    // Recalculate medals for this set
    const playersWithMedals = recalculateMedals(setPlayers, set.gameEntries);

    // Calculate fatts from all game entries in this set
    let playersWithFatts = setPlayers.map(p => ({ ...p, fatts: 0 }));
    for (const gameEntry of set.gameEntries) {
      playersWithFatts = applyGameEntry(playersWithFatts, gameEntry);
    }

    // Aggregate medals and fatts for each player in this set
    for (const setPlayer of setPlayers) {
      const playerWithMedals = playersWithMedals.find(p => p.id === setPlayer.id);
      const playerWithFatts = playersWithFatts.find(p => p.id === setPlayer.id);
      const stats = playerStatsMap.get(setPlayer.id);
      
      if (playerWithMedals && playerWithFatts && stats) {
        stats.goldMedals += playerWithMedals.goldMedals;
        stats.silverMedals += playerWithMedals.silverMedals;
        stats.bronzeMedals += playerWithMedals.bronzeMedals;
        stats.tomatoes += playerWithMedals.tomatoes;
        stats.fatts += playerWithFatts.fatts;
      }
    }
  }

  // Update all players with recalculated stats
  return allPlayers.map(player => {
    const stats = playerStatsMap.get(player.id);
    if (!stats) return player;

    const updatedPlayer = {
      ...player,
      goldMedals: stats.goldMedals,
      silverMedals: stats.silverMedals,
      bronzeMedals: stats.bronzeMedals,
      tomatoes: stats.tomatoes,
      fatts: stats.fatts,
    };
    // Recalculate points based on medals
    updatedPlayer.points = calculateMedalPoints(updatedPlayer);
    return updatedPlayer;
  });
}

