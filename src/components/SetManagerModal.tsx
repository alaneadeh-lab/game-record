import React from 'react';
import { X } from 'lucide-react';
import type { Player, PlayerSet } from '../types';

interface SetManagerModalProps {
  playerSets: PlayerSet[];
  allPlayers: Player[];
  currentSetIndex: number;
  onSetChange: (index: number) => void;
  onReorderSets: (newSets: PlayerSet[]) => void;
  onCreateSet: () => void;
  onDeleteSet: () => void;
  onClose: () => void;
}

export const SetManagerModal: React.FC<SetManagerModalProps> = ({
  playerSets,
  allPlayers,
  currentSetIndex,
  onSetChange,
  onReorderSets,
  onCreateSet,
  onDeleteSet,
  onClose,
}) => {
  const getPlayerNames = (playerIds: string[]) => {
    return playerIds
      .map(id => allPlayers.find(p => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const moveSet = (fromIndex: number, toIndex: number) => {
    const newSets = [...playerSets];
    const [movedSet] = newSets.splice(fromIndex, 1);
    newSets.splice(toIndex, 0, movedSet);
    onReorderSets(newSets);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Manage Sets</h2>
          <button
            onClick={onClose}
            className="button-3d p-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => {
            onCreateSet();
            onClose();
          }}
          className="menu-btn w-full py-3 rounded-xl font-bold text-center bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          ➕ Create New Set
        </button>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {playerSets.map((set, index) => (
            <div key={set.id} className="flex items-center gap-2">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => index > 0 && moveSet(index, index - 1)}
                  disabled={index === 0}
                  className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                >
                  ▲
                </button>
                <button
                  onClick={() => index < playerSets.length - 1 && moveSet(index, index + 1)}
                  disabled={index === playerSets.length - 1}
                  className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                >
                  ▼
                </button>
              </div>
              <button
                onClick={() => onSetChange(index)}
                className={`flex-1 py-3 rounded-xl font-bold text-center transition-colors ${
                  index === currentSetIndex
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {index === currentSetIndex && <span>✓</span>}
                  <div className="text-left">
                    <div className="font-semibold">{getPlayerNames(set.playerIds) || 'Empty Set'}</div>
                    <div className="text-xs opacity-75">{set.gameEntries.length} games</div>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>

        {playerSets.length > 1 && (
          <button
            onClick={() => {
              if (confirm(`Delete "${playerSets[currentSetIndex].name}"? This cannot be undone.`)) {
                onDeleteSet();
                onClose();
              }
            }}
            className="menu-btn danger w-full py-3 rounded-xl font-bold text-center bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            🗑️ Delete Current Set
          </button>
        )}

        <button
          onClick={onClose}
          className="menu-btn cancel w-full py-3 rounded-xl font-bold text-center bg-gray-300 text-gray-800 hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

