import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Delete, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { GameEntry, GameRound, GameWinnerType, Player } from '../types';

type WizardStep = 'roundPicker' | 'winner' | 'winnerType' | 'scores' | 'fattTie' | 'summary';

type DraftScore = {
  score: string;
  fatt: number;
};

type DraftRound = {
  id: string;
  winnerType: GameWinnerType | '';
  winnerId: string;
  playerScores: Record<string, DraftScore>;
};

interface RoundGameEntryFormProps {
  players: Player[];
  roundsPerGame: 3 | 5 | 7 | 9;
  gameNumber: number;
  initialRounds?: GameRound[];
  onDraftChange?: (rounds: GameRound[]) => void;
  onSave: (entry: Omit<GameEntry, 'id' | 'date'>) => void;
  onCancel: () => void;
}

const stepMotion = {
  initial: { opacity: 0, x: 28 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -28 },
  transition: { duration: 0.16, ease: 'easeOut' as const },
};

function createDraftRound(players: Player[]): DraftRound {
  return {
    id: uuidv4(),
    winnerType: '',
    winnerId: '',
    playerScores: Object.fromEntries(
      players.map((player) => [player.id, { score: '', fatt: 0 }])
    ),
  };
}

function draftFromGameRound(round: GameRound, players: Player[]): DraftRound {
  return {
    id: round.id,
    winnerType: round.winnerType,
    winnerId: round.winnerId,
    playerScores: Object.fromEntries(
      players.map((player) => {
        const score = round.playerScores.find((entry) => entry.playerId === player.id);
        return [
          player.id,
          {
            score: String(score?.score ?? 0),
            fatt: score?.fatt ?? 0,
          },
        ];
      })
    ),
  };
}

function isRoundComplete(round: DraftRound, players: Player[]): boolean {
  return Boolean(
    round.winnerId &&
      round.winnerType &&
      players.every((player) => round.playerScores[player.id]?.score !== '')
  );
}

function roundScore(round: DraftRound, playerId: string): number {
  const raw = round.playerScores[playerId]?.score;
  return raw === '' || raw == null ? 0 : Number(raw);
}

function toGameRound(round: DraftRound, players: Player[]): GameRound {
  return {
    id: round.id,
    winnerType: round.winnerType as GameWinnerType,
    winnerId: round.winnerId,
    playerScores: players.map((player) => ({
      playerId: player.id,
      score: roundScore(round, player.id),
      fatt: round.playerScores[player.id]?.fatt ?? 0,
    })),
  };
}

function PlayerAvatar({ player, size = 'large' }: { player: Player; size?: 'small' | 'large' }) {
  const sizeClass = size === 'large' ? 'h-20 w-20' : 'h-9 w-9';
  return (
    <div className={`${sizeClass} shrink-0 overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-purple-500 to-pink-500 shadow-md`}>
      {player.photo ? (
        <img src={player.photo} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-2xl font-black text-white">
          {player.name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export function RoundGameEntryForm({
  players,
  roundsPerGame,
  gameNumber,
  initialRounds = [],
  onDraftChange,
  onSave,
  onCancel,
}: RoundGameEntryFormProps) {
  const [rounds, setRounds] = useState<DraftRound[]>(() =>
    Array.from({ length: roundsPerGame }, (_, index) =>
      initialRounds[index]
        ? draftFromGameRound(initialRounds[index], players)
        : createDraftRound(players)
    )
  );
  const firstIncompleteIndex = Math.min(initialRounds.length, roundsPerGame - 1);
  const [roundIndex, setRoundIndex] = useState(firstIncompleteIndex);
  const [step, setStep] = useState<WizardStep>(
    initialRounds.length ? 'roundPicker' : 'winner'
  );
  const [activeLoserIndex, setActiveLoserIndex] = useState(0);
  const currentRound = rounds[roundIndex];
  const winner = players.find((player) => player.id === currentRound.winnerId);
  const losers = players.filter((player) => player.id !== currentRound.winnerId);

  const updateCurrentRound = (nextRound: DraftRound) => {
    setRounds((previous) =>
      previous.map((round, index) => (index === roundIndex ? nextRound : round))
    );
  };

  const publishCompletedDraft = (nextRound: DraftRound) => {
    const nextRounds = rounds.map((round, index) => (index === roundIndex ? nextRound : round));
    const completedRounds = nextRounds
      .filter((round) => isRoundComplete(round, players))
      .map((round) => toGameRound(round, players));
    onDraftChange?.(completedRounds);
  };

  const selectWinner = (playerId: string) => {
    updateCurrentRound({ ...currentRound, winnerId: playerId });
    setStep('winnerType');
  };

  const selectWinnerType = (winnerType: GameWinnerType) => {
    const winnerScore = winnerType === 'partial' ? -30 : -60;
    updateCurrentRound({
      ...currentRound,
      winnerType,
      playerScores: {
        ...currentRound.playerScores,
        [currentRound.winnerId]: {
          ...currentRound.playerScores[currentRound.winnerId],
          score: String(winnerScore),
        },
      },
    });
    setActiveLoserIndex(0);
    setStep('scores');
  };

  const finishScoreEntry = (round: DraftRound) => {
    const highestScore = Math.max(...players.map((player) => roundScore(round, player.id)));
    const highestPlayers = players.filter(
      (player) => roundScore(round, player.id) === highestScore
    );

    if (highestPlayers.length > 1) {
      setStep('fattTie');
      return;
    }

    const fattPlayerId = highestPlayers[0]?.id;
    const completedRound: DraftRound = {
      ...round,
      playerScores: Object.fromEntries(
        players.map((player) => [
          player.id,
          {
            ...round.playerScores[player.id],
            fatt: player.id === fattPlayerId ? 1 : 0,
          },
        ])
      ),
    };
    updateCurrentRound(completedRound);
    publishCompletedDraft(completedRound);
    setStep('summary');
  };

  const submitActiveScore = () => {
    const activePlayer = losers[activeLoserIndex];
    if (!activePlayer) return;
    const activeScore = currentRound.playerScores[activePlayer.id]?.score;
    if (activeScore === '') return;

    if (activeLoserIndex < losers.length - 1) {
      setActiveLoserIndex((index) => index + 1);
      return;
    }
    finishScoreEntry(currentRound);
  };

  const handleKey = (key: string) => {
    const activePlayer = losers[activeLoserIndex];
    if (!activePlayer) return;
    const currentValue = currentRound.playerScores[activePlayer.id]?.score ?? '';

    if (key === 'backspace') {
      updateCurrentRound({
        ...currentRound,
        playerScores: {
          ...currentRound.playerScores,
          [activePlayer.id]: {
            ...currentRound.playerScores[activePlayer.id],
            score: currentValue.slice(0, -1),
          },
        },
      });
      return;
    }
    if (key === 'enter') {
      submitActiveScore();
      return;
    }
    if (currentValue.length >= 4) return;
    updateCurrentRound({
      ...currentRound,
      playerScores: {
        ...currentRound.playerScores,
        [activePlayer.id]: {
          ...currentRound.playerScores[activePlayer.id],
          score: currentValue === '0' ? key : `${currentValue}${key}`,
        },
      },
    });
  };

  useEffect(() => {
    if (step !== 'scores') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        handleKey(event.key);
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        handleKey('backspace');
      } else if (event.key === 'Enter') {
        event.preventDefault();
        handleKey('enter');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const currentTotals = useMemo(
    () =>
      Object.fromEntries(
        players.map((player) => [
          player.id,
          rounds.slice(0, roundIndex + 1).reduce(
            (total, round) => total + roundScore(round, player.id),
            0
          ),
        ])
      ) as Record<string, number>,
    [players, rounds, roundIndex]
  );

  const chooseFatt = (playerId: string) => {
    const completedRound: DraftRound = {
      ...currentRound,
      playerScores: Object.fromEntries(
        players.map((player) => [
          player.id,
          {
            ...currentRound.playerScores[player.id],
            fatt: player.id === playerId ? 1 : 0,
          },
        ])
      ),
    };
    updateCurrentRound(completedRound);
    publishCompletedDraft(completedRound);
    setStep('summary');
  };

  const saveGame = () => {
    const savedRounds = rounds.map((round) => toGameRound(round, players));
    onSave({
      rounds: savedRounds,
      playerScores: players.map((player) => ({
        playerId: player.id,
        score: savedRounds.reduce(
          (total, round) =>
            total + (round.playerScores.find((score) => score.playerId === player.id)?.score ?? 0),
          0
        ),
        fatt: savedRounds.reduce(
          (total, round) =>
            total + (round.playerScores.find((score) => score.playerId === player.id)?.fatt ?? 0),
          0
        ),
      })),
    });
  };

  const openRound = (index: number) => {
    setRoundIndex(index);
    setActiveLoserIndex(0);
    setStep(isRoundComplete(rounds[index], players) ? 'summary' : 'winner');
  };

  const editRound = (index: number) => {
    setRounds((previous) =>
      previous.map((round, roundPosition) =>
        roundPosition === index ? { ...createDraftRound(players), id: round.id } : round
      )
    );
    setRoundIndex(index);
    setActiveLoserIndex(0);
    setStep('winner');
  };

  const nextRound = () => {
    if (roundIndex === roundsPerGame - 1) {
      saveGame();
      return;
    }
    const nextIndex = roundIndex + 1;
    setRoundIndex(nextIndex);
    setActiveLoserIndex(0);
    setStep(isRoundComplete(rounds[nextIndex], players) ? 'summary' : 'winner');
  };

  const goBack = () => {
    if (step === 'winnerType') setStep('winner');
    if (step === 'scores') setStep('winnerType');
    if (step === 'fattTie') setStep('scores');
  };

  const completedRoundCount = rounds.filter((round) => isRoundComplete(round, players)).length;

  const tiePlayers = useMemo(() => {
    const highest = Math.max(...players.map((player) => roundScore(currentRound, player.id)));
    return players.filter((player) => roundScore(currentRound, player.id) === highest);
  }, [currentRound, players]);

  return (
    <div className="fixed inset-0 z-[100] flex h-[100dvh] flex-col overflow-hidden bg-[#f8f5ff] text-gray-900">
      <header className="shrink-0 border-b border-purple-100 bg-white/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <button
            type="button"
            onClick={step === 'winner' || step === 'roundPicker' || step === 'summary' ? onCancel : goBack}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700 active:scale-95"
            aria-label={
              step === 'winner' || step === 'roundPicker' || step === 'summary'
                ? 'Close game entry'
                : 'Go back'
            }
          >
            {step === 'winner' || step === 'roundPicker' || step === 'summary' ? (
              <X className="h-6 w-6" />
            ) : (
              <ArrowLeft className="h-6 w-6" />
            )}
          </button>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-600">
              Game #{gameNumber}
            </p>
            <h2 className="text-xl font-black">Round {roundIndex + 1} of {roundsPerGame}</h2>
          </div>
          <div className="w-11 text-right text-sm font-black text-purple-600">
            {Math.round(((roundIndex + (step === 'summary' ? 1 : 0)) / roundsPerGame) * 100)}%
          </div>
        </div>

        <div className="mx-auto mt-3 grid max-w-lg grid-cols-4 gap-1.5 rounded-xl bg-gray-950 px-2 py-2 text-white">
          {players.map((player) => (
            <div key={player.id} className="min-w-0 text-center">
              <p className="truncate text-[10px] font-semibold text-gray-400">{player.name}</p>
              <p className="text-base font-black tabular-nums">{currentTotals[player.id]}</p>
            </div>
          ))}
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden px-4 py-3">
        <div className="mx-auto h-full max-w-lg">
          <>
            {step === 'roundPicker' && (
              <motion.section key="round-picker" {...stepMotion} className="flex h-full flex-col">
                <div className="mb-4 text-center">
                  <h3 className="text-2xl font-black">Current Game</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add the next round or edit a completed one
                  </p>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-3 gap-2 pb-3">
                  {rounds.map((round, index) => {
                    const complete = isRoundComplete(round, players);
                    const isNext = index === completedRoundCount;
                    const disabled = !complete && !isNext;
                    return (
                      <button
                        key={round.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => openRound(index)}
                        className={`flex min-h-0 flex-col items-center justify-center rounded-2xl border-2 p-2 transition active:scale-95 ${
                          complete
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                            : isNext
                              ? 'border-purple-400 bg-purple-600 text-white shadow-lg'
                              : 'border-gray-200 bg-gray-100 text-gray-400'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase tracking-wide">Round</span>
                        <span className="text-3xl font-black">{index + 1}</span>
                        <span className="mt-1 text-xs font-bold">
                          {complete ? 'Edit' : isNext ? 'Add' : 'Locked'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {completedRoundCount === roundsPerGame && (
                  <button
                    type="button"
                    onClick={saveGame}
                    className="mb-[max(0.25rem,env(safe-area-inset-bottom))] min-h-16 shrink-0 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-xl font-black text-white shadow-xl active:scale-[0.98]"
                  >
                    Finish Game
                  </button>
                )}
              </motion.section>
            )}

            {step === 'winner' && (
              <motion.section key="winner" {...stepMotion} className="flex h-full flex-col">
                <div className="mb-3 text-center">
                  <h3 className="text-2xl font-black">Who won this hand?</h3>
                  <p className="mt-1 text-sm text-gray-500">Tap the winner to continue</p>
                </div>
                <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
                  {players.map((player, index) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => selectWinner(player.id)}
                      className={`flex min-h-0 flex-col items-center justify-center rounded-3xl border-2 bg-white p-3 shadow-md transition active:scale-95 ${
                        ['border-blue-200', 'border-red-200', 'border-emerald-200', 'border-amber-200'][index % 4]
                      }`}
                    >
                      <PlayerAvatar player={player} />
                      <span className="mt-3 max-w-full truncate text-xl font-black">{player.name}</span>
                    </button>
                  ))}
                </div>
              </motion.section>
            )}

            {step === 'winnerType' && winner && (
              <motion.section key="winner-type" {...stepMotion} className="flex h-full flex-col justify-center">
                <div className="mb-5 text-center">
                  <div className="mx-auto w-fit"><PlayerAvatar player={winner} size="small" /></div>
                  <h3 className="mt-2 text-2xl font-black">How did {winner.name} win?</h3>
                </div>
                <div className="grid gap-4">
                  <button
                    type="button"
                    onClick={() => selectWinnerType('partial')}
                    className="flex min-h-32 items-center justify-between gap-4 rounded-3xl border-2 border-emerald-300 bg-emerald-50 px-6 py-5 text-left shadow-lg transition active:scale-[0.98]"
                  >
                    <span className="block text-4xl font-black text-emerald-900">🟢 Remi</span>
                    <span className="block text-4xl font-black tabular-nums text-emerald-600">-30</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => selectWinnerType('full')}
                    className="flex min-h-32 items-center justify-between gap-4 rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 via-yellow-100 to-orange-100 px-6 py-5 text-left shadow-lg shadow-amber-200/70 transition active:scale-[0.98]"
                  >
                    <span className="block text-4xl font-black text-amber-950">🏆 Hand</span>
                    <span className="block text-4xl font-black tabular-nums text-orange-600">-60</span>
                  </button>
                </div>
              </motion.section>
            )}

            {step === 'scores' && winner && (
              <motion.section key="scores" {...stepMotion} className="flex h-full flex-col">
                <div className="mb-2 flex shrink-0 items-center justify-between rounded-2xl bg-purple-100 px-3 py-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-500">Winner</p>
                    <p className="font-black text-purple-950">{winner.name}</p>
                  </div>
                  <p className="text-2xl font-black text-purple-700">{roundScore(currentRound, winner.id)}</p>
                </div>

                <div className="shrink-0 space-y-1.5">
                  {losers.map((player, index) => {
                    const isActive = index === activeLoserIndex;
                    const value = currentRound.playerScores[player.id]?.score ?? '';
                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => setActiveLoserIndex(index)}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2 text-left transition ${
                          isActive
                            ? 'border-purple-500 bg-white shadow-md'
                            : index < activeLoserIndex
                              ? 'border-emerald-200 bg-emerald-50'
                              : 'border-gray-200 bg-white/70'
                        }`}
                      >
                        <PlayerAvatar player={player} size="small" />
                        <span className="min-w-0 flex-1 truncate font-bold">{player.name}</span>
                        <span className={`min-w-16 text-right text-2xl font-black tabular-nums ${value === '' ? 'text-gray-300' : 'text-gray-900'}`}>
                          {value === '' ? '—' : value}
                        </span>
                        {index < activeLoserIndex && <Check className="h-5 w-5 text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 grid min-h-0 flex-1 grid-cols-3 grid-rows-4 gap-1.5 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKey(key)}
                      className="rounded-xl bg-white text-2xl font-black shadow-sm ring-1 ring-gray-200 active:scale-95 active:bg-purple-100"
                    >
                      {key}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleKey('backspace')}
                    className="flex items-center justify-center rounded-xl bg-gray-200 text-gray-800 active:scale-95"
                    aria-label="Delete digit"
                  >
                    <Delete className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKey('0')}
                    className="rounded-xl bg-white text-2xl font-black shadow-sm ring-1 ring-gray-200 active:scale-95 active:bg-purple-100"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKey('enter')}
                    disabled={currentRound.playerScores[losers[activeLoserIndex]?.id]?.score === ''}
                    className="rounded-xl bg-purple-600 px-2 text-sm font-black text-white shadow-md active:scale-95 disabled:opacity-30"
                  >
                    {activeLoserIndex === losers.length - 1 ? 'Done' : 'Enter'}
                  </button>
                </div>
              </motion.section>
            )}

            {step === 'fattTie' && (
              <motion.section key="fatt-tie" {...stepMotion} className="flex h-full flex-col justify-center">
                <div className="text-center">
                  <div className="text-5xl">😂</div>
                  <h3 className="mt-3 text-2xl font-black">Who receives the Fatt?</h3>
                  <p className="mt-1 text-gray-500">Highest score is tied</p>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {tiePlayers.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => chooseFatt(player.id)}
                      className="flex min-h-36 flex-col items-center justify-center rounded-3xl border-2 border-purple-200 bg-white p-4 shadow-lg active:scale-95"
                    >
                      <PlayerAvatar player={player} />
                      <span className="mt-2 text-lg font-black">{player.name}</span>
                      <span className="text-2xl font-black text-purple-600">{roundScore(currentRound, player.id)}</span>
                    </button>
                  ))}
                </div>
              </motion.section>
            )}

            {step === 'summary' && (
              <motion.section key="summary" {...stepMotion} className="flex h-full flex-col">
                <div className="shrink-0 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                    <Check className="h-8 w-8" />
                  </div>
                  <h3 className="mt-2 text-2xl font-black">Round Complete</h3>
                </div>

                <div className="my-3 grid min-h-0 flex-1 grid-cols-2 gap-2">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className={`flex min-h-0 flex-col items-center justify-center rounded-2xl border-2 p-2 ${
                        player.id === currentRound.winnerId
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <PlayerAvatar player={player} size="small" />
                      <p className="mt-1 max-w-full truncate text-sm font-bold">{player.name}</p>
                      <p className="text-2xl font-black tabular-nums">{roundScore(currentRound, player.id)}</p>
                      {currentRound.playerScores[player.id]?.fatt > 0 && (
                        <span className="text-xs font-bold text-purple-600">😂 Fatt</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mb-[max(0.25rem,env(safe-area-inset-bottom))] grid shrink-0 grid-cols-[auto_1fr] gap-2">
                  <button
                    type="button"
                    onClick={() => editRound(roundIndex)}
                    className="min-h-16 rounded-2xl border-2 border-purple-200 bg-white px-4 font-black text-purple-700 active:scale-[0.98]"
                  >
                    Edit Round
                  </button>
                  <button
                    type="button"
                    onClick={nextRound}
                    className="min-h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 text-xl font-black text-white shadow-xl active:scale-[0.98]"
                  >
                    {roundIndex === roundsPerGame - 1 ? 'Finish Game' : 'Next Round'}
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="col-span-2 min-h-14 rounded-2xl bg-emerald-600 px-4 text-lg font-black text-white shadow-lg active:scale-[0.98]"
                  >
                    Done
                  </button>
                </div>
              </motion.section>
            )}
          </>
        </div>
      </main>
    </div>
  );
}
