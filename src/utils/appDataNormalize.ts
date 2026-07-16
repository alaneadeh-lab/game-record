import type { AppData, PlayerSet } from '../types';
import { DEFAULT_WIN_SCORE_LIMIT } from './gameLogic';

export const DEFAULT_ROUNDS_PER_GAME = 5;

export function normalizeRoundsPerGame(value: unknown): 3 | 5 | 7 | 9 {
  return value === 3 || value === 5 || value === 7 || value === 9
    ? value
    : DEFAULT_ROUNDS_PER_GAME;
}

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
    roundsPerGame: normalizeRoundsPerGame(set.roundsPerGame),
  };
}

/** Legacy baseline names and star counts. */
const ASIM_NAME = 'عاصم';
const ASIM_BASELINE_WINS = 4;
const JAFAR_NAME = 'جعفر';
const JAFAR_BASELINE_WINS = 1;
const JAFAR_PREVIOUS_BASELINE_WINS = 2;

/**
 * Apply load-time migrations: default winScoreLimit on sets, and one-time legacy baselines.
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
    // Bump from previous baselines (2 or 3) or set if missing
    if (current === undefined || current < ASIM_BASELINE_WINS) {
      legacy = { ...legacy, [asimPlayer.id]: ASIM_BASELINE_WINS };
      dataVersion = dataVersion + 1;
    }
  }
  const jafarPlayer = data.allPlayers?.find((p: { name?: string }) => p.name === JAFAR_NAME);
  if (jafarPlayer) {
    const current = legacy[jafarPlayer.id];
    // Reduce from previous baseline (2 → 1), or set if missing / below target
    if (
      current === undefined ||
      current === JAFAR_PREVIOUS_BASELINE_WINS ||
      current < JAFAR_BASELINE_WINS
    ) {
      legacy = { ...legacy, [jafarPlayer.id]: JAFAR_BASELINE_WINS };
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
