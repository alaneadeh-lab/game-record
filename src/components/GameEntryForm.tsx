import React, { useState, useEffect } from 'react';
import { X, Save, Trophy, Medal, Award, Target } from 'lucide-react';
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

  // Quick preset functions for faster entry
  const applyQuickPreset = (preset: '1st' | '2nd' | '3rd' | '4th') => {
    const newScores = { ...scores };
    
    // Reset all scores first
    players.forEach(player => {
      newScores[player.id] = { score: 0, fatt: 0 };
    });

    // Apply preset scores (lower score = better rank)
    switch (preset) {
      case '1st':
        if (players[0]) newScores[players[0].id] = { score: 1, fatt: 0 };
        if (players[1]) newScores[players[1].id] = { score: 2, fatt: 0 };
        if (players[2]) newScores[players[2].id] = { score: 3, fatt: 0 };
        if (players[3]) newScores[players[3].id] = { score: 4, fatt: 0 };
        break;
      case '2nd':
        if (players[0]) newScores[players[0].id] = { score: 2, fatt: 0 };
        if (players[1]) newScores[players[1].id] = { score: 1, fatt: 0 };
        if (players[2]) newScores[players[2].id] = { score: 3, fatt: 0 };
        if (players[3]) newScores[players[3].id] = { score: 4, fatt: 0 };
        break;
      case '3rd':
        if (players[0]) newScores[players[0].id] = { score: 3, fatt: 0 };
        if (players[1]) newScores[players[1].id] = { score: 2, fatt: 0 };
        if (players[2]) newScores[players[2].id] = { score: 1, fatt: 0 };
        if (players[3]) newScores[players[3].id] = { score: 4, fatt: 0 };
        break;
      case '4th':
        if (players[0]) newScores[players[0].id] = { score: 4, fatt: 0 };
        if (players[1]) newScores[players[1].id] = { score: 3, fatt: 0 };
        if (players[2]) newScores[players[2].id] = { score: 2, fatt: 0 };
        if (players[3]) newScores[players[3].id] = { score: 1, fatt: 0 };
        break;
    }
    
    setScores(newScores);
  };

  const clearAllScores = () => {
    const newScores: Record<string, { score: number; fatt: number }> = {};
    players.forEach((p) => {
      newScores[p.id] = { score: 0, fatt: 0 };
    });
    setScores(newScores);
  };

  // Keyboard shortcuts for quick entry
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when no input is focused
      if (document.activeElement?.tagName === 'INPUT') return;
      
      switch (e.key.toLowerCase()) {
        case '1':
          e.preventDefault();
          applyQuickPreset('1st');
          break;
        case '2':
          e.preventDefault();
          applyQuickPreset('2nd');
          break;
        case '3':
          e.preventDefault();
          applyQuickPreset('3rd');
          break;
        case '4':
          e.preventDefault();
          applyQuickPreset('4th');
          break;
        case 'c':
          e.preventDefault();
          clearAllScores();
          break;
        case 'enter':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleSubmit(e as any);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

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
        {/* Quick Preset Buttons */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Quick Entry - Click buttons or use keyboard:
          </h4>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => applyQuickPreset('1st')}
              className="button-3d bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold py-2 px-3 rounded-lg shadow-3d hover:shadow-3d-hover flex items-center justify-center gap-1 text-sm"
            >
              <Trophy className="w-4 h-4" />
              1st Place (1)
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset('2nd')}
              className="button-3d bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold py-2 px-3 rounded-lg shadow-3d hover:shadow-3d-hover flex items-center justify-center gap-1 text-sm"
            >
              <Medal className="w-4 h-4" />
              2nd Place (2)
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset('3rd')}
              className="button-3d bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-2 px-3 rounded-lg shadow-3d hover:shadow-3d-hover flex items-center justify-center gap-1 text-sm"
            >
              <Award className="w-4 h-4" />
              3rd Place (3)
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset('4th')}
              className="button-3d bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-2 px-3 rounded-lg shadow-3d hover:shadow-3d-hover flex items-center justify-center gap-1 text-sm"
            >
              <Target className="w-4 h-4" />
              4th Place (4)
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearAllScores}
              className="flex-1 button-3d bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded-lg shadow-3d hover:shadow-3d-hover text-sm"
            >
              Clear All (C)
            </button>
            <div className="flex-1 text-xs text-gray-600 py-2 px-2 bg-gray-100 rounded text-center">
              <div>Ctrl/Cmd + Enter to save</div>
            </div>
          </div>
        </div>

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
                <input
                  type="number"
                  value={scores[player.id]?.score ?? 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setScores({
                      ...scores,
                      [player.id]: {
                        ...scores[player.id],
                        score: value,
                      },
                    });
                  }}
                  className="w-full px-4 py-3 border-4 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-purple-500 text-lg font-semibold embossed bg-white text-center hover:border-purple-400 transition-colors"
                  min="-999"
                  max="999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fatts
                </label>
                <input
                  type="number"
                  value={scores[player.id]?.fatt ?? 0}
                  onChange={(e) => {
                    const value = Math.max(0, parseInt(e.target.value) || 0);
                    setScores({
                      ...scores,
                      [player.id]: {
                        ...scores[player.id],
                        fatt: value,
                      },
                    });
                  }}
                  className="w-full px-4 py-3 border-4 border-red-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500 focus:border-red-500 text-lg font-semibold embossed bg-white text-center hover:border-red-400 transition-colors"
                  min="0"
                  max="99"
                />
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
