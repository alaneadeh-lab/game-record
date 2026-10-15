import React from 'react';
import type { Player } from '../types';

interface SetCompletionModalProps {
  winner: Player;
  winScoreLimit: number;
  podiumPoints: number;
  onComplete: () => void;
  onEdit: () => void;
}

export const SetCompletionModal: React.FC<SetCompletionModalProps> = ({
  winner,
  winScoreLimit,
  podiumPoints,
  onComplete,
  onEdit,
}) => {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-white to-gray-100 p-6 shadow-3d">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-yellow-400 bg-gradient-to-br from-pink-400 to-purple-500 text-3xl font-bold text-white shadow-lg">
            {winner.photo ? (
              <img src={winner.photo} alt={winner.name} className="h-full w-full object-cover" />
            ) : (
              winner.name.charAt(0).toUpperCase()
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Win limit reached!</h2>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{winner.name}</span> hit{' '}
            <span className="font-semibold">{podiumPoints}</span> / {winScoreLimit} podium points.
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Complete the set to lock in their ⭐ and award the Fatt, or keep editing results.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onComplete}
            className="button-3d w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 text-lg font-bold text-white shadow-3d"
          >
            Complete set ⭐
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="button-3d w-full rounded-2xl bg-gray-200 px-4 py-3 text-lg font-bold text-gray-800 shadow-card"
          >
            Edit results
          </button>
        </div>
      </div>
    </div>
  );
};
