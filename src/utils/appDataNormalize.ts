import type { AppData, PlayerSet } from '../types';
import { DEFAULT_WIN_SCORE_LIMIT } from './gameLogic';

/** Normalize a single set: ensure winScoreLimit in 1–9999, default 50. */
export function normalizeSet(set: Partial<PlayerSet> & { id: string; name: string }): PlayerSet {
  const n = set.winScoreLimit;
  const winScoreLimit =
    typeof n === 'number' && n >= 1 && n <= 9999 ? Math.floor(n) : DEFAULT_WIN_SCORE_LIMIT;
  return {
    id: set.id,
    name: set.name,
    playerIds: Array.isArray(set.playerIds) ? set.playerIds : [],
    gameEntries: Array.isArray(set.gameEntries) ? set.gameEntries : [],
    winScoreLimit,
    winScoreLabel: set.winScoreLabel,
  };
}

/** Name used for Asim baseline (عاصم). */
const ASIM_NAME = 'عاصم';
const ASIM_BASELINE_WINS = 3;

/**
 * Apply load-time migrations: default winScoreLimit on sets, and one-time Asim legacy baseline.
 * Mutates and returns the same data reference; use for load normalization.
 */
export function normalizeAppDataOnLoad(data: AppData): AppData {
  const sets = (data.sets || []).map(normalizeSet);
  let legacy = data.legacySetWinsByPlayerId;
  let dataVersion = typeof data.dataVersion === 'number' ? data.dataVersion : 0;

  if (!legacy || typeof legacy !== 'object') legacy = {};
  const asimPlayer = data.allPlayers?.find((p: { name?: string }) => p.name === ASIM_NAME);
  if (asimPlayer) {
    const current = legacy[asimPlayer.id];
    if (current === undefined || current === 2) {
      legacy = { ...legacy, [asimPlayer.id]: ASIM_BASELINE_WINS };
      dataVersion = dataVersion + 1;
    }
  }

  return {
    ...data,
    sets,
    legacySetWinsByPlayerId: Object.keys(legacy).length ? legacy : undefined,
    dataVersion,
  };
}
