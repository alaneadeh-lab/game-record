import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Users, Calendar, Layers } from 'lucide-react';
import { GameEntryForm } from './GameEntryForm';
import { PlayerSetSelector } from './PlayerSetSelector';
import { SetManagerModal } from './SetManagerModal';
import type { Player, GameEntry, PlayerSet } from '../types';
// Stats are calculated per-set, not stored globally

interface AdminPanelProps {
  playerSet: PlayerSet;
  allPlayers: Player[];
  playerSets: PlayerSet[];
  currentSetIndex: number;
  onUpdateSet: (updatedSet: PlayerSet) => void;
  onUpdateAllPlayers: (updater: (prev: Player[]) => Player[]) => void;
  onClose: () => void;
  onAddNewSet?: () => void;
  onOpenPlayerInventory: () => void;
  onSetChange: (index: number) => void;
  onDeleteSet: () => void;
  onReorderSets: (newSets: PlayerSet[]) => void;
  onRestoreFromMongo?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  playerSet,
  allPlayers,
  playerSets,
  currentSetIndex,
  onUpdateSet,
  onUpdateAllPlayers: _onUpdateAllPlayers, // Unused - stats are per-set, not global
  onClose,
  onAddNewSet,
  onOpenPlayerInventory,
  onSetChange,
  onDeleteSet,
  onReorderSets,
  onRestoreFromMongo,
}) => {
  const [activeTab, setActiveTab] = useState<'games' | 'players'>('games');
  const [editingGame, setEditingGame] = useState<GameEntry | null>(null);
  const [showGameForm, setShowGameForm] = useState(false);
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [showSetManager, setShowSetManager] = useState(false);

  // Resolve players from IDs
  const setPlayers = playerSet.playerIds
    .map(id => allPlayers.find(p => p.id === id))
    .filter((p): p is Player => p !== undefined);

  const handleSaveGame = (entryData: Omit<GameEntry, 'id' | 'date'>) => {
    let updatedEntries: GameEntry[];

    if (editingGame) {
      // Update existing entry (stats are calculated per-set on display)
      updatedEntries = playerSet.gameEntries.map((e) =>
        e.id === editingGame.id
          ? { ...entryData, id: editingGame.id, date: editingGame.date }
          : e
      );
      setEditingGame(null);
    } else {
      // Add new entry (stats are calculated per-set on display)
      const newEntry: GameEntry = {
        ...entryData,
        id: Date.now().toString(),
        date: new Date().toISOString(),
      };
      updatedEntries = [...playerSet.gameEntries, newEntry];
    }

    // Update the set with new/updated game entries
    // Stats are calculated per-set when displaying, not stored globally
    onUpdateSet({
      ...playerSet,
      gameEntries: updatedEntries,
    });

    setShowGameForm(false);
  };

  const handleDeleteGame = (entryId: string) => {
    const entry = playerSet.gameEntries.find((e) => e.id === entryId);
    if (entry && confirm('Delete this game entry?')) {
      // Remove entry from set (stats are calculated per-set on display)
      const updatedEntries = playerSet.gameEntries.filter((e) => e.id !== entryId);
      
      onUpdateSet({
        ...playerSet,
        gameEntries: updatedEntries,
      });
    }
  };

  const handleSavePlayerSelection = (playerIds: string[]) => {
    onUpdateSet({
      ...playerSet,
      playerIds,
    });
    setShowPlayerSelector(false);
  };

  return (
    <>
      {showPlayerSelector && (
        <PlayerSetSelector
          allPlayers={allPlayers}
          selectedPlayerIds={playerSet.playerIds}
          minPlayers={1}
          onSave={handleSavePlayerSelection}
          onCancel={() => setShowPlayerSelector(false)}
          title={`Manage Players - ${playerSet.name}`}
        />
      )}

    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm pointer-events-auto overflow-y-auto">
      <div className="relative z-50 min-h-full bg-gradient-to-br from-purple-100 via-pink-50 to-purple-100 p-4" style={{ pointerEvents: 'auto' }}>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pt-4">
              <h1 className="text-3xl font-bold text-gray-800">
                🎰 Admin - {playerSet.name}
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSetManager(true)}
                  className="button-3d bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-2 px-4 rounded-xl shadow-3d hover:shadow-3d-hover"
                >
                  <Layers className="w-4 h-4 inline mr-1" />
                  Manage Sets
                </button>
                {onAddNewSet && (
                  <button
                    onClick={onAddNewSet}
                    className="button-3d bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-2 px-4 rounded-xl shadow-3d hover:shadow-3d-hover"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    New Set
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="button-3d bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-xl shadow-card hover:shadow-card-hover"
                >
                  <X className="w-4 h-4 inline mr-1" />
                  Close
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('games')}
                className={`button-3d flex-1 py-3 px-4 rounded-xl font-bold shadow-card ${
                  activeTab === 'games'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white text-gray-800'
                }`}
              >
                <Calendar className="w-5 h-5 inline mr-2" />
                Games
              </button>
              <button
                onClick={() => setActiveTab('players')}
                className={`button-3d flex-1 py-3 px-4 rounded-xl font-bold shadow-card ${
                  activeTab === 'players'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white text-gray-800'
                }`}
              >
                <Users className="w-5 h-5 inline mr-2" />
                Players
              </button>
            </div>

            {/* Games Tab */}
            {activeTab === 'games' && (
              <div className="space-y-4">
                {!showGameForm && !editingGame && (
                  <button
                    onClick={() => setShowGameForm(true)}
                    className="button-3d w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 px-6 rounded-xl shadow-3d hover:shadow-3d-hover flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add New Game
                  </button>
                )}

                {(showGameForm || editingGame) && (
                  <div className="relative z-50 pointer-events-auto bg-white rounded-2xl p-6 shadow-3d">
                    <GameEntryForm
                      players={setPlayers}
                      onSave={handleSaveGame}
                      onCancel={() => {
                        setShowGameForm(false);
                        setEditingGame(null);
                      }}
                      editingEntry={editingGame || undefined}
                    />
                  </div>
                )}

                {/* Game History */}
                {!showGameForm && !editingGame && (
                  <div className="space-y-3">
                    {playerSet.gameEntries
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((entry, index) => (
                        <div
                          key={entry.id}
                          className="card-3d bg-white rounded-xl p-4 shadow-card border-2 border-gray-200 hover:shadow-card-hover"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="font-bold text-gray-800">
                                Game #{playerSet.gameEntries.length - index}
                              </div>
                              <div className="text-sm text-gray-600">
                                {new Date(entry.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingGame(entry)}
                                className="button-3d p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteGame(entry.id)}
                                className="button-3d p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {entry.playerScores.map((ps) => {
                              const player = setPlayers.find((p) => p.id === ps.playerId);
                              return (
                                <div
                                  key={ps.playerId}
                                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-2 text-center border border-gray-200"
                                >
                                  <div className="text-xs text-gray-600 mb-1 font-semibold">
                                    {player?.name || 'Unknown'}
                                  </div>
                                  <div className="font-bold text-blue-700">Score: {ps.score}</div>
                                  <div className="font-bold text-red-700">Fatt: {ps.fatt}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    {playerSet.gameEntries.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No games recorded yet. Add your first game!
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Players Tab */}
            {activeTab === 'players' && (
              <div className="space-y-4">
                <div className="card-3d bg-white rounded-xl p-4 shadow-3d">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Set Players</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Manage which players are included in this set. Players are managed globally in the Player Inventory.
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          console.log('Manage Set Players clicked');
                          setShowPlayerSelector(true);
                        }}
                        className="button-3d bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-xl shadow-3d hover:shadow-3d-hover flex items-center justify-center gap-2 cursor-pointer relative z-10"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <Users className="w-5 h-5" />
                        Manage Set Players
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Player Inventory clicked');
                          onOpenPlayerInventory();
                        }}
                        className="button-3d bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold py-3 px-6 rounded-xl shadow-3d hover:shadow-3d-hover flex items-center justify-center gap-2 cursor-pointer relative z-10"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <Users className="w-5 h-5" />
                        Player Inventory
                      </button>
                    </div>
                  </div>
                </div>

                {/* MongoDB Restore Section */}
                <div className="card-3d bg-white rounded-xl p-4 shadow-3d">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Restore Data</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Restore data from MongoDB if it was lost or deleted.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        console.log('Restore from MongoDB clicked');
                        if (onRestoreFromMongo) {
                          onRestoreFromMongo();
                        } else {
                          alert('Restore functionality not available. Please close admin panel and use the restore button on the main screen.');
                        }
                      }}
                      className="button-3d bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-3d hover:shadow-3d-hover flex items-center justify-center gap-2 cursor-pointer relative z-10"
                      style={{ pointerEvents: 'auto' }}
                    >
                      🔄 Restore from MongoDB
                    </button>
                  </div>
                </div>

                {/* Current Set Players List */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-800">Players in this set ({setPlayers.length}):</h4>
                  {setPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="card-3d bg-white rounded-xl p-4 shadow-card border-2 border-gray-200"
                    >
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
                        <div className="flex-1">
                          <div className="font-bold text-lg">{player.name}</div>
                          <div className="text-sm text-gray-600">
                            Points: {player.points} | Fatts: {player.fatts} | 
                            Medals: 🥇{player.goldMedals} 🥈{player.silverMedals} 🥉{player.bronzeMedals}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {setPlayers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No players in this set. Click "Manage Set Players" to add players.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Set Manager Modal */}
      {showSetManager && (
        <SetManagerModal
          playerSets={playerSets}
          allPlayers={allPlayers}
          currentSetIndex={currentSetIndex}
          onSetChange={onSetChange}
          onReorderSets={onReorderSets}
          onCreateSet={() => {
            setShowSetManager(false);
            if (onAddNewSet) onAddNewSet();
          }}
          onDeleteSet={() => {
            setShowSetManager(false);
            onDeleteSet();
          }}
          onClose={() => setShowSetManager(false)}
        />
      )}
    </>
  );
};
