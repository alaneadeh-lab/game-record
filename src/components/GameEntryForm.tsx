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

  // Get the next field in sequence for auto-advancement
  const getNextField = (currentPlayerId: string, currentField: 'score' | 'fatt') => {
    const currentPlayerIndex = players.findIndex(p => p.id === currentPlayerId);
    
    if (currentField === 'score') {
      // Move to fatt for same player
      return { playerId: currentPlayerId, field: 'fatt' as const };
    } else {
      // Move to next player's score
      const nextPlayerIndex = currentPlayerIndex + 1;
      if (nextPlayerIndex < players.length) {
        return { playerId: players[nextPlayerIndex].id, field: 'score' as const };
      }
    }
    
    // No more fields
    return null;
  };

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
    if (!activeKeypad) return;
    
    // Auto-advance to next field
    const nextField = getNextField(activeKeypad.playerId, activeKeypad.field);
    setActiveKeypad(nextField);
  };

  const handleKeypadCancel = () => {
    // Just close the keypad without advancing
    setActiveKeypad(null);
  };

  // Calculate progress
  const totalFields = players.length * 2; // score + fatt for each player
  const completedFields = players.reduce((count, player) => {
    const playerScore = scores[player.id];
    if (playerScore) {
      if (playerScore.score !== 0) count++; // Count non-zero scores
      if (playerScore.fatt !== 0) count++; // Count non-zero fatts
    }
    return count;
  }, 0);

  // Generate player-specific colors
  const getPlayerColor = (playerId: string) => {
    const playerIndex = players.findIndex(p => p.id === playerId);
    const colors = [
      '#3B82F6', // Blue
      '#EF4444', // Red
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#06B6D4', // Cyan
      '#84CC16', // Lime
    ];
    return colors[playerIndex % colors.length];
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
          onCancel={handleKeypadCancel}
          allowNegative={activeKeypad.field === 'score'}
          title={`${players.find((p) => p.id === activeKeypad.playerId)?.name} - ${activeKeypad.field === 'score' ? 'نتيجة' : 'فتة'}`}
          playerColor={getPlayerColor(activeKeypad.playerId)}
        />
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Start Button */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
          <div className="text-center">
            <h4 className="font-bold text-gray-800 mb-2">🚀 Quick Entry Mode</h4>
            <p className="text-sm text-gray-600 mb-3">
              Click "Start Entry" to begin sequential input. Each field will open automatically after the previous one.
            </p>
            {/* Progress Indicator */}
            <div className="mb-3">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{completedFields}/{totalFields} fields</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedFields / totalFields) * 100}%` }}
                ></div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveKeypad({ playerId: players[0]?.id, field: 'score' })}
              className="button-3d bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-xl shadow-3d hover:shadow-3d-hover"
            >
              🎯 Start Entry
            </button>
          </div>
        </div>

      <div className="space-y-4">
        {players.map((player) => (
          <div
            key={player.id}
            className={`card-3d bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 shadow-card border-2 transition-all duration-300 ${
              activeKeypad?.playerId === player.id 
                ? 'border-blue-500 shadow-blue-200 scale-105' 
                : 'border-gray-200'
            }`}
          >
            <h3 className="font-bold text-lg mb-3 text-gray-800 flex items-center gap-2">
              {player.name}
              {activeKeypad?.playerId === player.id && (
                <span className="text-blue-600 animate-pulse">🎯</span>
              )}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score (lower is better)
                </label>
                <button
                  type="button"
                  onClick={() => setActiveKeypad({ playerId: player.id, field: 'score' })}
                  className={`w-full px-4 py-3 border-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-purple-500 text-lg font-semibold embossed bg-white text-left hover:border-purple-400 transition-colors ${
                    activeKeypad?.playerId === player.id && activeKeypad?.field === 'score'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300'
                  }`}
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
                  className={`w-full px-4 py-3 border-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500 focus:border-red-500 text-lg font-semibold embossed bg-white text-left hover:border-red-400 transition-colors ${
                    activeKeypad?.playerId === player.id && activeKeypad?.field === 'fatt'
                      ? 'border-red-500 bg-red-50'
                      : 'border-red-300'
                  }`}
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
