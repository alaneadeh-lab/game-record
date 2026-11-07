/**
 * Locked set stars. Keep this in sync with src/utils/gameLogic.ts.
 * A star is recorded the first time a set reaches its win limit and is never removed.
 */

const DEFAULT_WIN_SCORE_LIMIT = 50;

type SetForStars = {
  id?: string;
  playerIds?: string[];
  gameEntries?: { playerScores?: { playerId: string; score: number }[] }[];
  winScoreLimit?: number;
};

function getWinScoreLimit(set: { winScoreLimit?: number }): number {
  const n = set.winScoreLimit;
  if (typeof n === 'number' && n >= 1 && n <= 9999) return Math.floor(n);
  return DEFAULT_WIN_SCORE_LIMIT;
}

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

function getCompletedSetWinnerIds(set: SetForStars): string[] | null {
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

export function solidifySetWins(existing: unknown, sets: SetForStars[] | undefined): Record<string, string[]> {
  const solidified = readSolidifiedSetWins(existing);
  for (const set of Array.isArray(sets) ? sets : []) {
    if (!set?.id || solidified[set.id]) continue;
    const winnerIds = getCompletedSetWinnerIds(set);
    if (winnerIds) solidified[set.id] = winnerIds;
  }
  return solidified;
}

/** Stored stars win over an incoming copy, then any newly finished set is locked. */
export function mergeSolidifiedSetWins(
  stored: unknown,
  incoming: unknown,
  sets: SetForStars[] | undefined
): Record<string, string[]> | undefined {
  const merged = {
    ...readSolidifiedSetWins(incoming),
    ...readSolidifiedSetWins(stored),
  };
  const solidified = solidifySetWins(merged, sets);
  return Object.keys(solidified).length ? solidified : undefined;
}
