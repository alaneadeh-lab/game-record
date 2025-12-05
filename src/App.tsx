import { useState, useEffect, useCallback } from 'react';
import { Settings } from 'lucide-react';
import { PlayersView } from './components/PlayersView';
import { AdminPanel } from './components/AdminPanel';
import { PinModal } from './components/PinModal';
import { SetManagerModal } from './components/SetManagerModal';
import { PlayerInventory } from './components/PlayerInventory';
import { PlayerSetSelector } from './components/PlayerSetSelector';
import { Layers } from 'lucide-react';
import { storageService, checkLocalStorageStatus } from './services/storageService';
import type { PlayerSet, Player, AppData } from './types';

function App() {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [playerSets, setPlayerSets] = useState<PlayerSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPlayerInventory, setShowPlayerInventory] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showNewSetSelector, setShowNewSetSelector] = useState(false);
  const [showSetMenu, setShowSetMenu] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [storageStatus, setStorageStatus] = useState<ReturnType<typeof checkLocalStorageStatus> | null>(null);

  // Check localStorage status on mount
  useEffect(() => {
    const status = checkLocalStorageStatus();
    setStorageStatus(status);
    if (!status.available || !status.working) {
      console.error('⚠️ localStorage issue detected:', status.error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const appData = await storageService.loadAppData();
        setAllPlayers(appData.allPlayers);
        setPlayerSets(appData.sets);
      } catch (error) {
        console.error('Failed to load data:', error);
        const appData = await storageService.loadAppData();
        setAllPlayers(appData.allPlayers);
        setPlayerSets(appData.sets);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Save data whenever allPlayers or playerSets changes (with debouncing)
  useEffect(() => {
    if (isLoading) return;
    // Don't save if we haven't loaded any data yet (prevents overwriting with empty arrays)
    if (playerSets.length === 0 && allPlayers.length === 0) return;

    setSaveStatus('saving');

    const timeoutId = setTimeout(async () => {
      try {
        const appData: AppData = {
          allPlayers,
          sets: playerSets,
        };
        await storageService.saveAppData(appData);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('❌ Failed to save data:', error);
        setSaveStatus('error');
        
        // Show user-friendly error message for quota exceeded
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          // Error message is already shown by storageService, but we can add UI feedback
          setTimeout(() => {
            alert('⚠️ Storage quota exceeded!\n\nYour data is too large to save. Please:\n- Remove some player photos\n- Use smaller images\n- Clear browser cache');
          }, 100);
        }
        
        setTimeout(() => setSaveStatus('idle'), 5000);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [allPlayers, playerSets, isLoading]);

  const handleUpdateSet = useCallback((updatedSet: PlayerSet) => {
    setPlayerSets(prev => {
      // create a new array reference
      const updated = [...prev];

      // replace the active set
      updated[currentSetIndex] = { ...updatedSet };

      return updated; // triggers React update
    });
  }, [currentSetIndex]);

  // Helper to resolve players from IDs
  const resolvePlayers = useCallback((playerIds: string[]): Player[] => {
    return playerIds
      .map(id => allPlayers.find(p => p.id === id))
      .filter((p): p is Player => p !== undefined);
  }, [allPlayers]);

  // Helper to count sets using a player
  const setsUsingPlayer = useCallback((playerId: string): number => {
    return playerSets.filter(set => set.playerIds.includes(playerId)).length;
  }, [playerSets]);

  // Player inventory handlers
  const handleUpdatePlayer = useCallback((playerId: string, updates: Partial<Player>) => {
    setAllPlayers(prev => prev.map(p => p.id === playerId ? { ...p, ...updates } : p));
  }, []);

  const handleAddPlayer = useCallback((playerData: Omit<Player, 'id'>) => {
    const newPlayer: Player = {
      ...playerData,
      id: Date.now().toString(),
    };
    setAllPlayers(prev => [...prev, newPlayer]);
  }, []);

  const handleDeletePlayer = useCallback((playerId: string) => {
    setAllPlayers(prev => prev.filter(p => p.id !== playerId));
    // Remove player from all sets
    setPlayerSets(prev => prev.map(set => ({
      ...set,
      playerIds: set.playerIds.filter(id => id !== playerId),
    })));
  }, []);

  const handleUpdateAllPlayers = useCallback((updater: (prev: Player[]) => Player[]) => {
    setAllPlayers(updater);
  }, []);

  const handleCreateSet = useCallback(() => {
    if (allPlayers.length < 4) {
      // If less than 4 players, open Player Inventory to add more
      setShowPlayerInventory(true);
      return;
    }
    setShowNewSetSelector(true);
  }, [allPlayers]);

  const handleDeleteSet = useCallback(() => {
    if (playerSets.length <= 1) {
      alert('Cannot delete the last set. You must have at least one set.');
      return;
    }
    
    setPlayerSets(prev => {
      const newSets = prev.filter((_, index) => index !== currentSetIndex);
      // Adjust current index if needed
      if (currentSetIndex >= newSets.length) {
        setCurrentSetIndex(newSets.length - 1);
      }
      return newSets;
    });
  }, [currentSetIndex, playerSets.length]);

  const handleSaveNewSet = useCallback((playerIds: string[]) => {
    setPlayerSets((prev) => {
      const newSet: PlayerSet = {
        id: Date.now().toString(),
        name: `Set ${prev.length + 1}`,
        playerIds,
        gameEntries: [],
      };
      const newSets = [...prev, newSet];
      setCurrentSetIndex(newSets.length - 1);
      return newSets;
    });
    setShowNewSetSelector(false);
  }, []);

  const handleSetChange = useCallback((index: number) => {
    if (index >= 0 && index < playerSets.length) {
      setCurrentSetIndex(index);
    }
  }, [playerSets.length]);

  const handleAdminClick = () => {
    if (showAdmin) {
      setShowAdmin(false);
    } else {
      setShowPinModal(true);
    }
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    setShowAdmin(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-casino-felt">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🎰</div>
          <div className="text-2xl font-bold text-white mb-2">Loading...</div>
          <div className="text-white opacity-75">Loading game data...</div>
        </div>
      </div>
    );
  }

  const currentSet = playerSets[currentSetIndex];

  if (!currentSet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-casino-felt">
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-2">No Player Set</div>
          <button
            onClick={handleCreateSet}
            className="button-3d bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-2 px-4 rounded-lg shadow-3d"
          >
            Create New Set
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-casino-felt relative">
      {/* Save Status Indicator */}
      {saveStatus !== 'idle' && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
          saveStatus === 'saving' ? 'bg-yellow-500 text-white' :
          saveStatus === 'saved' ? 'bg-green-500 text-white' :
          'bg-red-500 text-white'
        }`}>
          {saveStatus === 'saving' && '💾 Saving...'}
          {saveStatus === 'saved' && '✅ Saved!'}
          {saveStatus === 'error' && '❌ Save Failed'}
        </div>
      )}

      {/* localStorage Status Indicator */}
      {storageStatus && (!storageStatus.available || !storageStatus.working) && (
        <div className="fixed top-16 right-4 px-4 py-2 rounded-lg shadow-lg z-50 bg-red-500 text-white max-w-xs">
          <div className="font-bold mb-1">⚠️ Storage Issue</div>
          <div className="text-sm">{storageStatus.error || 'localStorage not working'}</div>
        </div>
      )}

      {/* Pin Modal */}
      {showPinModal && (
        <PinModal
          correctPin="88"
          onSuccess={handlePinSuccess}
          onCancel={() => setShowPinModal(false)}
        />
      )}

      {/* New Set Selector */}
      {showNewSetSelector && (
        <PlayerSetSelector
          allPlayers={allPlayers}
          selectedPlayerIds={[]}
          minPlayers={4}
          onSave={handleSaveNewSet}
          onCancel={() => setShowNewSetSelector(false)}
          title="Create New Set"
        />
      )}

      {/* Player Inventory */}
      {showPlayerInventory && (
        <PlayerInventory
          allPlayers={allPlayers}
          onUpdatePlayer={handleUpdatePlayer}
          onAddPlayer={handleAddPlayer}
          onDeletePlayer={handleDeletePlayer}
          onClose={() => setShowPlayerInventory(false)}
          setsUsingPlayer={setsUsingPlayer}
        />
      )}

      {/* Admin Panel */}
      {showAdmin && !showPlayerInventory && (
        <AdminPanel
          playerSet={currentSet}
          allPlayers={allPlayers}
          onUpdateSet={handleUpdateSet}
          onUpdateAllPlayers={handleUpdateAllPlayers}
          onClose={() => setShowAdmin(false)}
          onAddNewSet={handleCreateSet}
          onOpenPlayerInventory={() => setShowPlayerInventory(true)}
        />
      )}

      {/* Set Manager Modal */}
      {showSetMenu && (
        <SetManagerModal
          playerSets={playerSets}
          currentSetIndex={currentSetIndex}
          onSetChange={handleSetChange}
          onCreateSet={handleCreateSet}
          onDeleteSet={handleDeleteSet}
          onClose={() => setShowSetMenu(false)}
        />
      )}

      {/* Main Players View */}
      {!showAdmin && !showPlayerInventory && (
        <div className="flex-1 flex flex-col relative z-10 min-h-0">
          <div className="text-center pt-10 sm:pt-12 pb-1 sm:pb-2 flex-shrink-0">
            <h1 className="text-xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
              🎴 Hand Game Tracker
            </h1>
          </div>
          <PlayersView players={resolvePlayers(currentSet.playerIds)} />
        </div>
      )}

      {/* Set Manager FAB */}
      {!showAdmin && !showPlayerInventory && (
        <button
          onClick={() => setShowSetMenu(true)}
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-3d bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center button-3d hover:shadow-3d-hover z-40"
          aria-label="Manage sets"
        >
          <Layers className="w-7 h-7" />
        </button>
      )}

      {/* Admin Button */}
      <button
        onClick={handleAdminClick}
        className={`fixed bottom-4 right-4 w-16 h-16 bg-gradient-to-br ${
          showAdmin 
            ? 'from-red-500 to-red-600' 
            : 'from-purple-600 to-pink-600'
        } text-white rounded-full shadow-3d hover:shadow-3d-hover flex items-center justify-center button-3d z-50`}
        aria-label={showAdmin ? "Close admin" : "Open admin"}
      >
        {showAdmin ? (
          <span className="text-2xl">✕</span>
        ) : (
          <Settings className="w-7 h-7" />
        )}
      </button>
    </div>
  );
}

export default App;
