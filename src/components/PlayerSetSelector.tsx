import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { Player } from '../types';

interface PlayerSetSelectorProps {
  allPlayers: Player[];
  selectedPlayerIds: string[];
  minPlayers?: number;
  onSave: (playerIds: string[]) => void;
  onCancel: () => void;
  title?: string;
}

export const PlayerSetSelector: React.FC<PlayerSetSelectorProps> = ({
  allPlayers,
  selectedPlayerIds,
  minPlayers = 4,
  onSave,
  onCancel,
  title = 'Select Players',
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedPlayerIds);

  const togglePlayer = (playerId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };

  const handleSave = () => {
    if (selectedIds.length < minPlayers) {
      alert(`Please select at least ${minPlayers} players.`);
      return;
    }
    onSave(selectedIds);
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

