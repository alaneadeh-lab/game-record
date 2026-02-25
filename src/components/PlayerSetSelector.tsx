import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { Player } from '../types';

const MIN_WIN_LIMIT = 1;
const MAX_WIN_LIMIT = 9999;

interface PlayerSetSelectorProps {
  allPlayers: Player[];
  selectedPlayerIds: string[];
  minPlayers?: number;
  onSave: (playerIds: string[], winScoreLimit?: number) => void;
  onCancel: () => void;
  title?: string;
  /** Show win limit selector (e.g. for Create New Set). */
  showWinLimit?: boolean;
  defaultWinScoreLimit?: number;
}

export const PlayerSetSelector: React.FC<PlayerSetSelectorProps> = ({
  allPlayers,
  selectedPlayerIds,
  minPlayers = 4,
  onSave,
  onCancel,
  title = 'Select Players',
  showWinLimit = false,
  defaultWinScoreLimit = 50,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedPlayerIds);
  const [winLimitPreset, setWinLimitPreset] = useState<'25' | '50' | '100' | 'custom'>(
    defaultWinScoreLimit === 25 ? '25' : defaultWinScoreLimit === 100 ? '100' : defaultWinScoreLimit === 50 ? '50' : 'custom'
  );
  const [customWinLimit, setCustomWinLimit] = useState<string>(
    [25, 50, 100].includes(defaultWinScoreLimit) ? '' : String(defaultWinScoreLimit)
  );

  const togglePlayer = (playerId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };

  const getWinScoreLimit = (): number => {
    if (winLimitPreset === 'custom') {
      const n = parseInt(customWinLimit, 10);
      if (!Number.isNaN(n) && n >= MIN_WIN_LIMIT && n <= MAX_WIN_LIMIT) return Math.floor(n);
      return defaultWinScoreLimit;
    }
    if (winLimitPreset === '25') return 25;
    if (winLimitPreset === '100') return 100;
    return 50;
  };

  const handleSave = () => {
    if (selectedIds.length < minPlayers) {
      alert(`Please select at least ${minPlayers} players.`);
      return;
    }
    if (showWinLimit && winLimitPreset === 'custom') {
      const n = parseInt(customWinLimit, 10);
      if (Number.isNaN(n) || n < MIN_WIN_LIMIT || n > MAX_WIN_LIMIT) {
        alert(`حد الفوز يجب أن يكون بين ${MIN_WIN_LIMIT} و ${MAX_WIN_LIMIT}.`);
        return;
      }
    }
    const limit = showWinLimit ? getWinScoreLimit() : undefined;
    onSave(selectedIds, limit);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm pointer-events-auto">
      <div className="relative z-50 max-w-2xl mx-auto min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-3d p-6 w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <button
              onClick={onCancel}
              className="button-3d p-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            Select at least {minPlayers} players ({selectedIds.length} selected)
          </div>

          {showWinLimit && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-sm font-semibold text-gray-800 mb-1">حد الفوز (Win limit)</div>
              <p className="text-xs text-gray-600 mb-3">
                حد الفوز: عند وصول أي لاعب إلى هذا العدد من النقاط تنتهي اللعبة.
                <span className="block mt-1 text-gray-500">Win limit: when any player reaches this score, the game ends.</span>
              </p>
              <div className="flex flex-wrap gap-2 items-center">
                {([25, 50, 100] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setWinLimitPreset(String(n) as '25' | '50' | '100')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      winLimitPreset === String(n)
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-purple-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setWinLimitPreset('custom')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm ${
                    winLimitPreset === 'custom'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-purple-400'
                  }`}
                >
                  Custom
                </button>
                {winLimitPreset === 'custom' && (
                  <input
                    type="number"
                    min={MIN_WIN_LIMIT}
                    max={MAX_WIN_LIMIT}
                    value={customWinLimit}
                    onChange={(e) => setCustomWinLimit(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-20 px-2 py-2 border-2 border-gray-300 rounded-lg text-center font-medium"
                    placeholder="1–9999"
                  />
                )}
              </div>
            </div>
          )}

          <div className="space-y-2 mb-6 max-h-[60vh] overflow-y-auto">
            {allPlayers.map((player) => {
              const isSelected = selectedIds.includes(player.id);
              return (
                <div
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`card-3d rounded-xl p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-500'
                      : 'bg-white border-2 border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePlayer(player.id)}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div className="glossy-avatar w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                      {player.photo ? (
                        <img
                          src={player.photo}
                          alt={player.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-white">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">{player.name}</div>
                      <div className="text-xs text-gray-600">
                        Points: {player.points} | Fatts: {player.fatts}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={selectedIds.length < minPlayers}
              className={`button-3d flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-xl shadow-3d hover:shadow-3d-hover flex items-center justify-center gap-2 ${
                selectedIds.length < minPlayers ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Save className="w-5 h-5" />
              Save ({selectedIds.length} players)
            </button>
            <button
              onClick={onCancel}
              className="button-3d bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl shadow-card hover:shadow-card-hover"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

