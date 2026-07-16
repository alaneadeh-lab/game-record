import { useState } from 'react';
import type { GameEntry, GameRound, Player } from '../types';

interface CurrentGameTotalsProps {
  players: Player[];
  gameEntries: GameEntry[];
  currentScores?: Array<{ playerId: string; score: number }>;
  currentRounds?: GameRound[];
  roundsCompleted?: number;
  roundsPerGame?: number;
  onClick?: () => void;
  className?: string;
}

export function CurrentGameTotals({
  players,
  gameEntries,
  currentScores,
  currentRounds,
  roundsCompleted,
  roundsPerGame,
  onClick,
  className = '',
}: CurrentGameTotalsProps) {
  const [expanded, setExpanded] = useState(false);
  const currentGame = gameEntries.reduce<GameEntry | undefined>((latest, entry) => {
    if (!latest) return entry;
    return new Date(entry.date).getTime() > new Date(latest.date).getTime() ? entry : latest;
  }, undefined);

  const displayedRounds = currentRounds ?? currentGame?.rounds ?? [];
  const displayedRoundsCompleted =
    roundsCompleted ?? currentGame?.rounds?.length ?? (currentGame ? roundsPerGame : 0) ?? 0;

  return (
    <section
      className={`w-full rounded-3xl bg-[#020712] px-3 py-4 text-white shadow-xl sm:px-6 ${className}`}
      aria-label="Current game scores"
    >
      <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center">
        {roundsPerGame != null &&
        displayedRoundsCompleted >= roundsPerGame &&
        onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="justify-self-start rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-emerald-500 active:scale-95"
          >
            New Game
          </button>
        ) : (
          <span aria-hidden />
        )}
        {roundsPerGame != null && (
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-purple-300 sm:text-sm">
            {displayedRoundsCompleted} of {roundsPerGame} rounds
          </p>
        )}
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="justify-self-end rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-slate-200 transition hover:bg-white/20 active:scale-95"
          aria-expanded={expanded}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={`grid w-full gap-2 ${
          onClick ? 'cursor-pointer rounded-xl transition active:scale-[0.99] active:bg-slate-900' : ''
        }`}
        style={{ gridTemplateColumns: `repeat(${Math.max(players.length, 1)}, minmax(0, 1fr))` }}
      >
        {players.map((player) => {
          const score = currentScores
            ? currentScores.find((entry) => entry.playerId === player.id)?.score ?? 0
            : currentGame?.playerScores.find((entry) => entry.playerId === player.id)?.score ?? 0;
          return (
            <div key={player.id} className="min-w-0 text-center">
              <p className="truncate text-xs font-semibold text-slate-400 sm:text-base">
                {player.name}
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums sm:text-3xl">{score}</p>
            </div>
          );
        })}
      </button>

      {expanded && (
        <div className="mt-4 border-t border-white/15 pt-3">
          {displayedRounds.length ? (
            <div className="space-y-1.5">
              <div
                className="grid items-center gap-1 text-center text-[10px] font-semibold text-slate-500"
                style={{
                  gridTemplateColumns: `2.5rem repeat(${Math.max(players.length, 1)}, minmax(0, 1fr))`,
                }}
              >
                <span />
                {players.map((player) => (
                  <span key={player.id} className="truncate">{player.name}</span>
                ))}
              </div>
              {displayedRounds.map((round, index) => (
                <div
                  key={round.id}
                  className="grid items-center gap-1 rounded-xl bg-white/5 px-1 py-2 text-center"
                  style={{
                    gridTemplateColumns: `2.5rem repeat(${Math.max(players.length, 1)}, minmax(0, 1fr))`,
                  }}
                >
                  <span className="text-xs font-bold text-purple-300">R{index + 1}</span>
                  {players.map((player) => {
                    const playerScore = round.playerScores.find(
                      (score) => score.playerId === player.id
                    );
                    return (
                      <span key={player.id} className="text-sm font-black tabular-nums">
                        {playerScore?.score ?? 0}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-2 text-center text-sm text-slate-400">No rounds entered yet.</p>
          )}
        </div>
      )}
    </section>
  );
}
