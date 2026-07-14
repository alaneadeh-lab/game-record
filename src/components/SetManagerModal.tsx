import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Player, PlayerSet } from '../types';

interface SetManagerModalProps {
  playerSets: PlayerSet[];
  allPlayers: Player[];
  currentSetIndex: number;
  onSetChange: (index: number) => void;
  onReorderSets: (newSets: PlayerSet[]) => void;
  onCreateSet: () => void;
  onDeleteSets: (setIds: string[]) => void;
  onClose: () => void;
}

export const SetManagerModal: React.FC<SetManagerModalProps> = ({
  playerSets,
  allPlayers,
  currentSetIndex,
  onSetChange,
  onReorderSets,
  onCreateSet,
  onDeleteSets,
  onClose,
}) => {
  const [selectedSetIds, setSelectedSetIds] = useState<Set<string>>(new Set());

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

  const toggleSetSelection = (setId: string) => {
    setSelectedSetIds(prev => {
      const next = new Set(prev);
      if (next.has(setId)) {
        next.delete(setId);
      } else {
        next.add(setId);
      }
      return next;
    });
  };

  const allButOneSelected =
    playerSets.length > 1 && selectedSetIds.size === playerSets.length - 1;

  const toggleSelectAll = () => {
    if (allButOneSelected) {
      setSelectedSetIds(new Set());
      return;
    }
    // Keep at least one set (prefer keeping the current set)
    setSelectedSetIds(
      new Set(playerSets.filter((_, i) => i !== currentSetIndex).map(s => s.id))
    );
  };

  const handleDeleteSelected = () => {
    const ids = Array.from(selectedSetIds);
    if (ids.length === 0) return;

    if (ids.length >= playerSets.length) {
      alert('Cannot delete all sets. You must keep at least one set.');
      return;
    }

    const names = ids
      .map(id => {
        const set = playerSets.find(s => s.id === id);
        return set ? (getPlayerNames(set.playerIds) || set.name || 'Empty Set') : null;
      })
      .filter(Boolean);

    const label =
      ids.length === 1
        ? `"${names[0]}"`
        : `${ids.length} sets (${names.slice(0, 3).join(', ')}${names.length > 3 ? '…' : ''})`;

    if (confirm(`Delete ${label}? This cannot be undone.`)) {
      onDeleteSets(ids);
      onClose();
    }
  };

  const canDelete = selectedSetIds.size > 0 && selectedSetIds.size < playerSets.length;

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

        {playerSets.length > 1 && (
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={allButOneSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300"
              />
              Select all
            </label>
            {selectedSetIds.size > 0 && (
              <span className="text-sm text-gray-500">{selectedSetIds.size} selected</span>
            )}
          </div>
        )}

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {playerSets.map((set, index) => (
            <div key={set.id} className="flex items-center gap-2">
              {playerSets.length > 1 && (
                <input
                  type="checkbox"
                  checked={selectedSetIds.has(set.id)}
                  onChange={() => toggleSetSelection(set.id)}
                  className="w-5 h-5 rounded border-gray-300 shrink-0"
                  aria-label={`Select ${getPlayerNames(set.playerIds) || set.name || 'set'}`}
                />
              )}
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

        {canDelete && (
          <button
            onClick={handleDeleteSelected}
            className="menu-btn danger w-full py-3 rounded-xl font-bold text-center bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            🗑️ Delete Selected ({selectedSetIds.size})
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
