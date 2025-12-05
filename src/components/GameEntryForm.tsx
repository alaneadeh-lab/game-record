import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { NumericKeypad } from './NumericKeypad';
import type { Player, GameEntry } from '../types';

interface GameEntryFormProps {
  players: Player[];
  onSave: (entry: Omit<GameEntry, 'id' | 'date'>) => void;
  onCancel: () => void;
  editingEntry?: GameEntry;
}

export const GameEntryForm: React.FC<GameEntryFormProps> = ({
  players,
  onSave,
  onCancel,
  editingEntry,
}) => {
  const [scores, setScores] = useState<Record<string, { score: number; fatt: number }>>(() => {
    if (editingEntry) {
      const initial: Record<string, { score: number; fatt: number }> = {};
      editingEntry.playerScores.forEach((ps) => {
        initial[ps.playerId] = { score: ps.score, fatt: ps.fatt };
      });
      return initial;
    }
    const initial: Record<string, { score: number; fatt: number }> = {};
    players.forEach((p) => {
      initial[p.id] = { score: 0, fatt: 0 };
    });
    return initial;
  });

  const [activeKeypad, setActiveKeypad] = useState<{
    playerId: string;
    field: 'score' | 'fatt';
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const playerScores = players.map((player) => ({
      playerId: player.id,
      score: scores[player.id]?.score ?? 0,
      fatt: scores[player.id]?.fatt ?? 0,
    }));
    onSave({ playerScores });
  };

  const handleKeypadChange = (value: number) => {
    if (!activeKeypad) return;
    
    setScores({
      ...scores,
      [activeKeypad.playerId]: {
        ...scores[activeKeypad.playerId],
        [activeKeypad.field]: value,
      },
    });
  };

  const handleKeypadClose = () => {
    setActiveKeypad(null);
  };

  return (
    <>
      {activeKeypad && (
        <NumericKeypad
          value={
            activeKeypad.field === 'score'
              ? scores[activeKeypad.playerId]?.score ?? 0
              : scores[activeKeypad.playerId]?.fatt ?? 0
          }
          onChange={handleKeypadChange}
          onClose={handleKeypadClose}
          allowNegative={activeKeypad.field === 'score'}
          label={
            activeKeypad.field === 'score'
              ? `Score - ${players.find((p) => p.id === activeKeypad.playerId)?.name}`
              : `Fatts - ${players.find((p) => p.id === activeKeypad.playerId)?.name}`
          }
        />
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        {players.map((player) => (
          <div
            key={player.id}
            className="card-3d bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 shadow-card border-2 border-gray-200"
          >
            <h3 className="font-bold text-lg mb-3 text-gray-800">{player.name}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score (lower is better)
                </label>
                <button
                  type="button"
                  onClick={() => setActiveKeypad({ playerId: player.id, field: 'score' })}
                  className="w-full px-4 py-3 border-4 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-purple-500 text-lg font-semibold embossed bg-white text-left hover:border-purple-400 transition-colors"
                >
                  {scores[player.id]?.score ?? 0}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fatts
                </label>
                <button
                  type="button"
                  onClick={() => setActiveKeypad({ playerId: player.id, field: 'fatt' })}
                  className="w-full px-4 py-3 border-4 border-red-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500 focus:border-red-500 text-lg font-semibold embossed bg-white text-left hover:border-red-400 transition-colors"
                >
                  {scores[player.id]?.fatt ?? 0}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="button-3d flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-xl shadow-3d hover:shadow-3d-hover flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {editingEntry ? 'Update Game' : 'Save Game'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="button-3d bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl shadow-card hover:shadow-card-hover flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          Cancel
        </button>
      </div>
    </form>
    </>
  );
};
