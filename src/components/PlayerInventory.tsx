import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import { PlayerEditor } from './PlayerEditor';
import type { Player } from '../types';

interface PlayerInventoryProps {
  allPlayers: Player[];
  onUpdatePlayer: (playerId: string, updates: Partial<Player>) => void;
  onAddPlayer: (playerData: Omit<Player, 'id'>) => void;
  onDeletePlayer: (playerId: string) => void;
  onClose: () => void;
  setsUsingPlayer: (playerId: string) => number; // Count of sets using this player
}

export const PlayerInventory: React.FC<PlayerInventoryProps> = ({
  allPlayers,
  onUpdatePlayer,
  onAddPlayer,
  onDeletePlayer,
  onClose,
  setsUsingPlayer,
}) => {
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSavePlayer = (playerId: string, updates: Partial<Player>) => {
    onUpdatePlayer(playerId, updates);
    setEditingPlayer(null);
  };

  const handleAddPlayer = (updates: Partial<Player>) => {
    if (!updates.name || !updates.name.trim()) {
      alert('Please enter a player name');
      return;
    }
    const newPlayer: Omit<Player, 'id'> = {
      name: updates.name.trim(),
      photo: updates.photo,
      points: 0,
      fatts: 0,
      goldMedals: 0,
      silverMedals: 0,
      bronzeMedals: 0,
    };
    onAddPlayer(newPlayer);
    setShowAddForm(false);
  };

  const handleDeletePlayer = (playerId: string) => {
    const usageCount = setsUsingPlayer(playerId);
    if (usageCount > 0) {
      alert(`Cannot delete player: This player is used in ${usageCount} set(s). Remove them from all sets first.`);
      return;
    }
    if (confirm('Delete this player?')) {
      onDeletePlayer(playerId);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm pointer-events-auto">
      <div className="relative z-50 min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-purple-100 p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pt-4">
            <h1 className="text-3xl font-bold text-gray-800">
              👥 Player Inventory
            </h1>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="button-3d bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Close
              </button>
            </div>
          </div>

          {/* Add Player Button */}
          <div className="mb-6">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="button-3d bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-xl shadow-3d hover:shadow-3d-hover flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add New Player
              </button>
            ) : (
              <div className="card-3d bg-white rounded-xl p-4 shadow-3d">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-gray-800">Add New Player</h3>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="button-3d p-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <PlayerEditor
                  player={{
                    id: 'temp',
                    name: '',
                    points: 0,
                    fatts: 0,
                    goldMedals: 0,
                    silverMedals: 0,
                    bronzeMedals: 0,
                  }}
                  onSave={handleAddPlayer}
                  onCancel={() => setShowAddForm(false)}
                />
              </div>
            )}
          </div>

          {/* Players List */}
          <div className="space-y-4">
            {allPlayers.map((player) => (
              <div key={player.id}>
                {editingPlayer?.id === player.id ? (
                  <div className="card-3d bg-white rounded-xl p-4 shadow-3d sm:px-6">
                    <PlayerEditor
                      player={player}
                      onSave={(updates) => handleSavePlayer(player.id, updates)}
                      onCancel={() => setEditingPlayer(null)}
                    />
                  </div>
                ) : (
                  <div className="card-3d bg-white rounded-xl p-4 shadow-card border-2 border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="glossy-avatar w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                          {player.photo ? (
                            <img
                              src={player.photo}
                              alt={player.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-bold text-white">
                              {player.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-lg">{player.name}</div>
                          <div className="text-sm text-gray-600">
                            Points: {player.points} | Fatts: {player.fatts} | 
                            Medals: 🥇{player.goldMedals} 🥈{player.silverMedals} 🥉{player.bronzeMedals}
                          </div>
                          {setsUsingPlayer(player.id) > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              Used in {setsUsingPlayer(player.id)} set(s)
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingPlayer(player)}
                          className="button-3d p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(player.id)}
                          className="button-3d p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          disabled={setsUsingPlayer(player.id) > 0}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {allPlayers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-4">No players yet</p>
              <p className="text-sm">Click "Add New Player" to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

