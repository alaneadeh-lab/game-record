import assert from 'node:assert/strict';
import {
  completePlayerSet,
  getHighestScorePlayerIds,
  getSetWinsByPlayerId,
  getSolidifiedFattsByPlayerId,
  getStarWinnerPlayerId,
  hasReachedWinLimit,
} from '../src/utils/gameLogic.ts';

const players = [
  { id: '1', name: 'A', points: 0, fatts: 0, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, tomatoes: 0 },
  { id: '2', name: 'B', points: 0, fatts: 0, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, tomatoes: 0 },
  { id: '3', name: 'C', points: 0, fatts: 0, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, tomatoes: 0 },
  { id: '4', name: 'D', points: 0, fatts: 0, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, tomatoes: 0 },
];

const setAtLimit = {
  id: 's1',
  name: 'Test',
  playerIds: ['1', '2', '3', '4'],
  winScoreLimit: 3,
  gameEntries: [
    {
      id: 'g1',
      date: new Date().toISOString(),
      playerScores: [
        { playerId: '1', score: 10, fatt: 0 },
        { playerId: '2', score: 20, fatt: 0 },
        { playerId: '3', score: 30, fatt: 0 },
        { playerId: '4', score: 40, fatt: 0 },
      ],
    },
  ],
};

assert.equal(hasReachedWinLimit(setAtLimit), true);
assert.equal(getStarWinnerPlayerId(setAtLimit, players), '1');
assert.deepEqual(getHighestScorePlayerIds(setAtLimit), ['4']);

const completed = completePlayerSet(setAtLimit, '1', '4');
assert.equal(completed.completed, true);
assert.equal(completed.starAwardedToPlayerId, '1');
assert.equal(completed.fattAwardedToPlayerId, '4');

const stars = getSetWinsByPlayerId({ allPlayers: players, sets: [completed] });
assert.equal(stars['1'], 1);
const fatts = getSolidifiedFattsByPlayerId([completed]);
assert.equal(fatts['4'], 1);

// Star survives wiping games after lock metadata is present
const wiped = { ...completed, gameEntries: [] };
const starsAfterWipe = getSetWinsByPlayerId({ allPlayers: players, sets: [wiped] });
assert.equal(starsAfterWipe['1'], 1);

// Fatt tie
const tied = {
  ...setAtLimit,
  gameEntries: [
    {
      id: 'g1',
      date: new Date().toISOString(),
      playerScores: [
        { playerId: '1', score: 10, fatt: 0 },
        { playerId: '2', score: 40, fatt: 0 },
        { playerId: '3', score: 30, fatt: 0 },
        { playerId: '4', score: 40, fatt: 0 },
      ],
    },
  ],
};
assert.deepEqual(getHighestScorePlayerIds(tied).sort(), ['2', '4']);

console.log('SET_COMPLETION_VERIFY_OK');
