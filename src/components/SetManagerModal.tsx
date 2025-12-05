import React from 'react';
import { X } from 'lucide-react';
import type { PlayerSet } from '../types';

interface SetManagerModalProps {
  playerSets: PlayerSet[];
  currentSetIndex: number;
  onSetChange: (index: number) => void;
  onCreateSet: () => void;
  onDeleteSet: () => void;
  onClose: () => void;
}

export const SetManagerModal: React.FC<SetManagerModalProps> = ({
  playerSets,
  currentSetIndex,
  onSetChange,
  onCreateSet,
  onDeleteSet,
  onClose,
}) => {
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
            <button
              key={set.id}
              onClick={() => {
                onSetChange(index);
                onClose();
              }}
              className={`menu-btn w-full py-3 rounded-xl font-bold text-center transition-colors ${
                index === currentSetIndex
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              {index === currentSetIndex ? '✓ ' : '➡️ '}
              {set.name}
            </button>
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

