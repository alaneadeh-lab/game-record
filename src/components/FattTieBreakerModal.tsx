import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices } from 'lucide-react';
import type { Player } from '../types';

interface FattTieBreakerModalProps {
  players: Player[];
  scoresByPlayerId: Record<string, number>;
  onSelect: (playerId: string) => void;
}

export const FattTieBreakerModal: React.FC<FattTieBreakerModalProps> = ({
  players,
  scoresByPlayerId,
  onSelect,
}) => {
  const [shuffling, setShuffling] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [chosenId, setChosenId] = useState<string | null>(null);

  const tiedPlayers = useMemo(
    () => players.filter((player) => player.id in scoresByPlayerId),
    [players, scoresByPlayerId]
  );

  useEffect(() => {
    if (!shuffling || tiedPlayers.length === 0) return;

    const tick = window.setInterval(() => {
      setHighlightIndex((previous) => (previous + 1) % tiedPlayers.length);
    }, 120);

    const finish = window.setTimeout(() => {
      window.clearInterval(tick);
      const winner = tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];
      setChosenId(winner.id);
      setShuffling(false);
      window.setTimeout(() => onSelect(winner.id), 900);
    }, 2000);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(finish);
    };
  }, [shuffling, tiedPlayers, onSelect]);

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-gradient-to-br from-white to-purple-50 p-6 shadow-3d">
        <div className="mb-4 text-center">
          <div className="text-4xl">😂</div>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Fatt tie!</h2>
          <p className="mt-1 text-sm text-gray-600">
            Highest score is shared. Pick who gets the humiliating +1 Fatt, or let fate decide.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          {tiedPlayers.map((player, index) => {
            const isHighlighted = shuffling && index === highlightIndex;
            const isChosen = chosenId === player.id;
            return (
              <motion.button
                key={player.id}
                type="button"
                disabled={shuffling || chosenId !== null}
                onClick={() => onSelect(player.id)}
                animate={
                  shuffling
                    ? {
                        x: isHighlighted ? [-6, 6, -4, 4, 0] : 0,
                        rotate: isHighlighted ? [-4, 4, -2, 2, 0] : 0,
                        scale: isHighlighted ? 1.05 : 0.96,
                      }
                    : { scale: isChosen ? 1.08 : 1 }
                }
                transition={{ duration: 0.12 }}
                className={`rounded-2xl border-4 p-3 text-center shadow-card transition ${
                  isChosen
                    ? 'border-purple-600 bg-purple-100'
                    : isHighlighted
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-gray-200 bg-white hover:border-purple-400'
                }`}
              >
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-xl font-bold text-white">
                  {player.photo ? (
                    <img src={player.photo} alt={player.name} className="h-full w-full object-cover" />
                  ) : (
                    player.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="font-bold text-gray-900">{player.name}</div>
                <div className="text-xs text-gray-500">Score {scoresByPlayerId[player.id] ?? 0}</div>
                <AnimatePresence>
                  {isChosen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-2xl"
                    >
                      😂
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={shuffling || chosenId !== null}
          onClick={() => {
            setChosenId(null);
            setShuffling(true);
          }}
          className="button-3d flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-lg font-bold text-white shadow-3d disabled:opacity-60"
        >
          <Dices className="h-5 w-5" />
          {shuffling ? 'Shuffling...' : 'Random'}
        </button>
      </div>
    </div>
  );
};
