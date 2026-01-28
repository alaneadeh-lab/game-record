import { useState, useEffect, useCallback, useRef } from 'react';
import { PlayersView } from './components/PlayersView';
import { AdminPanel } from './components/AdminPanel';
import { SetManagerModal } from './components/SetManagerModal';
import { PlayerInventory } from './components/PlayerInventory';
import { PlayerSetSelector } from './components/PlayerSetSelector';
import { GameEntryForm } from './components/GameEntryForm';
import { storageService, checkLocalStorageStatus } from './services/storageService';
import { calculatePlayerStatsForSet } from './utils/gameLogic';
import { checkLocalStorageData, uploadLocalStorageToMongoDB } from './utils/dataRecovery';
import type { PlayerSet, Player, AppData, GameEntry } from './types';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [playerSets, setPlayerSets] = useState<PlayerSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPlayerInventory, setShowPlayerInventory] = useState(false);
  const [showNewSetSelector, setShowNewSetSelector] = useState(false);
  const [showSetMenu, setShowSetMenu] = useState(false);
  const [showGameForm, setShowGameForm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [storageStatus, setStorageStatus] = useState<ReturnType<typeof checkLocalStorageStatus> | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<'checking' | 'found' | 'uploading' | 'success' | 'error' | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // Casino-themed background colors that change with each set
  const casinoColors = [
    'bg-gradient-to-br from-green-800 via-green-900 to-emerald-900', // Classic green felt
    'bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900',   // Royal blue
    'bg-gradient-to-br from-purple-800 via-purple-900 to-violet-900', // Royal purple
    'bg-gradient-to-br from-red-800 via-red-900 to-rose-900',       // Burgundy
    'bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900',   // Charcoal
    'bg-gradient-to-br from-teal-800 via-teal-900 to-cyan-900',     // Ocean blue
    'bg-gradient-to-br from-orange-800 via-orange-900 to-amber-900', // Sunset orange
    'bg-gradient-to-br from-pink-800 via-pink-900 to-rose-900',     // Hot pink
  ];

  // Get current background color based on set index
  const currentBgColor = casinoColors[currentSetIndex % casinoColors.length];
  useEffect(() => {
    const status = checkLocalStorageStatus();
    setStorageStatus(status);
    if (!status.available || !status.working) {
      console.error('⚠️ localStorage issue detected:', status.error);
    }

    // Check if using MongoDB and if there's localStorage data to recover
    const useMongoDB = import.meta.env.VITE_API_URL !== undefined;
    if (useMongoDB) {
      const checkResult = checkLocalStorageData();
      if (checkResult.exists && checkResult.data) {
        const hasRealData = checkResult.data.allPlayers.length > 0 || checkResult.data.sets.length > 0;
        if (hasRealData) {
          console.log('📦 Found localStorage data that can be recovered!');
          setRecoveryStatus('found');
          setShowRecoveryModal(true);
        }
      }
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const appData = await storageService.loadAppData();

        // Handle case where no data exists
        if (appData.allPlayers.length === 0) {
          const defaultPlayers: Player[] = [
            { id: '1', name: 'Player 1', points: 0, fatts: 0, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, tomatoes: 0 },
            { id: '2', name: 'Player 2', points: 0, fatts: 0, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, tomatoes: 0 },
            { id: '3', name: 'Player 3', points: 0, fatts: 0, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, tomatoes: 0 },
            { id: '4', name: 'Player 4', points: 0, fatts: 0, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, tomatoes: 0 },
          ];
          const defaultSet: PlayerSet = {
            id: uuidv4(),
            name: 'Default Set',
            playerIds: defaultPlayers.map(p => p.id),
            gameEntries: [],
          };

          setAllPlayers(defaultPlayers);
          setPlayerSets([defaultSet]);

          // Save default data
          await storageService.saveAppData({
            allPlayers: defaultPlayers,
            sets: [defaultSet],
          });
        } else {
          // Data exists, use it
          setAllPlayers(appData.allPlayers);
          setPlayerSets(appData.sets.length > 0 ? appData.sets : [{
            id: uuidv4(),
            name: 'Default Set',
            playerIds: appData.allPlayers.slice(0, 4).map(p => p.id),
            gameEntries: [],
          }]);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        // Fallback to default data
        const defaultPlayers: Player[] = [
          { id: '1', name: 'Player 1', points: 0, fatts: 0, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, tomatoes: 0 },
          { id: '2', name: 'Player 2', points: 0, fatts: 0, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, tomatoes: 0 },
          { id: '3', name: 'Player 3', points: 0, fatts: 0, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, tomatoes: 0 },
          { id: '4', name: 'Player 4', points: 0, fatts: 0, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, tomatoes: 0 },
        ];
        const defaultSet: PlayerSet = {
          id: uuidv4(),
          name: 'Default Set',
          playerIds: defaultPlayers.map(p => p.id),
          gameEntries: [],
        };
        setAllPlayers(defaultPlayers);
        setPlayerSets([defaultSet]);
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
    // Generate unique ID using timestamp + random to avoid collisions
    const newPlayer: Player = {
      ...playerData,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    console.log('➕ Adding new player:', newPlayer.name, newPlayer.id);
    setAllPlayers(prev => {
      const updated = [...prev, newPlayer];
      console.log('📊 Total players after add:', updated.length);
      return updated;
    });
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

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeStarted, setSwipeStarted] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const scrollableContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const handleSwipeLeft = useCallback(() => {
    // Swipe left - go to next set
    if (playerSets.length > 0) {
      // Reset scroll of the set we're leaving
      const leavingIndex = currentSetIndex;
      const leavingContainer = scrollableContainerRefs.current.get(leavingIndex);
      if (leavingContainer) {
        leavingContainer.scrollTop = 0;
      }
      
      const nextIndex = (currentSetIndex + 1) % playerSets.length;
      setCurrentSetIndex(nextIndex);
    }
  }, [currentSetIndex, playerSets.length]);

  const handleSwipeRight = useCallback(() => {
    // Swipe right - go to previous set
    if (playerSets.length > 0) {
      // Reset scroll of the set we're leaving
      const leavingIndex = currentSetIndex;
      const leavingContainer = scrollableContainerRefs.current.get(leavingIndex);
      if (leavingContainer) {
        leavingContainer.scrollTop = 0;
      }
      
      const prevIndex = currentSetIndex === 0 ? playerSets.length - 1 : currentSetIndex - 1;
      setCurrentSetIndex(prevIndex);
    }
  }, [currentSetIndex, playerSets.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsSwiping(false);
    setSwipeStarted(false);
    setSwipeOffset(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX === null) return;
    
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - touchStartX;
    const screenWidth = window.innerWidth;
    
    // Require minimum swipe distance (10% of screen width) before starting animation
    const minSwipeDistance = screenWidth * 0.1;
    
    // Only start swiping if movement is significant enough
    if (Math.abs(deltaX) < minSwipeDistance) {
      setSwipeOffset(0);
      setIsSwiping(false);
      setSwipeStarted(false);
      return;
    }
    
    // Mark swipe as started
    if (!swipeStarted) {
      setIsSwiping(true);
      setSwipeStarted(true);
    }
    
    // Calculate swipe offset (percentage of screen width)
    // Subtract the minimum distance from the calculation to avoid jump
    const adjustedDeltaX = deltaX > 0 
      ? deltaX - minSwipeDistance 
      : deltaX + minSwipeDistance;
    const offset = (adjustedDeltaX / screenWidth) * 100;
    
    // Check boundaries
    const isAtFirst = currentSetIndex === 0;
    const isAtLast = currentSetIndex === playerSets.length - 1;
    
    // Apply resistance at boundaries (reduce movement by 70%)
    let finalOffset = offset;
    if (deltaX > 0 && isAtFirst) {
      // Swiping right at first set - apply strong resistance
      finalOffset = offset * 0.3;
    } else if (deltaX < 0 && isAtLast) {
      // Swiping left at last set - apply strong resistance
      finalOffset = offset * 0.3;
    }
    
    setSwipeOffset(finalOffset);
  }, [touchStartX, currentSetIndex, playerSets.length, swipeStarted]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX === null) {
      setIsSwiping(false);
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;
    const screenWidth = window.innerWidth;
    const swipeThreshold = screenWidth * 0.25; // 25% of screen width

    const isAtFirst = currentSetIndex === 0;
    const isAtLast = currentSetIndex === playerSets.length - 1;

    // Check if we're at boundaries and trying to swipe beyond
    if (deltaX > 0 && isAtFirst) {
      // Swiping right at first - bounce back
      setSwipeOffset(0);
      setTimeout(() => {
        setSwipeOffset(0);
      }, 300);
    } else if (deltaX < 0 && isAtLast) {
      // Swiping left at last - bounce back
      setSwipeOffset(0);
      setTimeout(() => {
        setSwipeOffset(0);
      }, 300);
    } else if (Math.abs(deltaX) > swipeThreshold) {
      // Significant swipe - change set
      if (deltaX > 0) {
        handleSwipeRight();
      } else {
        handleSwipeLeft();
      }
      setSwipeOffset(0);
    } else {
      // Not enough swipe - bounce back to current position
      setSwipeOffset(0);
    }

    setTouchStartX(null);
    setIsSwiping(false);
  }, [touchStartX, currentSetIndex, playerSets.length, handleSwipeLeft, handleSwipeRight]);

  const handleSaveGameFromMain = useCallback((entryData: Omit<GameEntry, 'id' | 'date'>) => {
    const set = playerSets[currentSetIndex];
    if (!set) return;

    const newEntry: GameEntry = {
      ...entryData,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };

    // Update the set with new game entry (stats are calculated per-set on display)
    handleUpdateSet({
      ...set,
      gameEntries: [...set.gameEntries, newEntry],
    });

    setShowGameForm(false);
  }, [currentSetIndex, playerSets, handleUpdateSet]);

  const handleAdminClick = () => {
    if (showAdmin) {
      setShowAdmin(false);
    } else {
      setShowAdmin(true);
    }
  };

  const handleAddGameClick = () => {
    setShowGameForm(true);
  };

  const handleRecoveryUpload = useCallback(async () => {
    try {
      setRecoveryStatus('uploading');
      setRecoveryError(null);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5200/api';
      const userId = import.meta.env.VITE_USER_ID || 'default';
      
      const result = await uploadLocalStorageToMongoDB(apiUrl, userId);
      
      if (result.success) {
        setRecoveryStatus('success');
        // Reload the page to fetch the newly uploaded data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setRecoveryStatus('error');
        setRecoveryError(result.error || 'Failed to upload data');
      }
    } catch (error) {
      setRecoveryStatus('error');
      setRecoveryError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, []);

  if (isLoading) {
  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-800 via-green-900 to-emerald-900">
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
    const checkLocalStorageForRecovery = () => {
      const checkResult = checkLocalStorageData();
      if (checkResult.exists && checkResult.data) {
        const hasRealData = checkResult.data.allPlayers.length > 0 || checkResult.data.sets.length > 0;
        if (hasRealData) {
          // Show stats in console and alert
          if (checkResult.stats) {
            console.log('📦 Recovery data preview:', checkResult.stats);
            const statsMsg = `Found in localStorage:\n` +
              `- ${checkResult.stats.players} players\n` +
              `- ${checkResult.stats.sets} sets\n` +
              `- ${checkResult.stats.totalGames} total games\n` +
              `- ${checkResult.stats.playersWithPhotos} players with photos\n` +
              `- ${checkResult.stats.playersWithNames} custom player names\n\n` +
              `Click "Upload to MongoDB" to restore this data.`;
            alert(statsMsg);
          }
          setRecoveryStatus('found');
          setShowRecoveryModal(true);
        } else {
          alert('No data found in localStorage to recover.');
        }
      } else {
        alert('No data found in localStorage. If you had data before, it may have been cleared.');
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-800 via-green-900 to-emerald-900">
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-2">No Player Set</div>
          <div className="text-white opacity-75 mb-4">
            {allPlayers.length >= 4 
              ? 'Click below to create your first player set'
              : `${allPlayers.length} players added. You need at least 4 players to create a set.`}
          </div>
          <button
            onClick={handleCreateSet}
            className="button-3d bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-2 px-4 rounded-lg shadow-3d mb-3"
          >
            {allPlayers.length >= 4 ? 'Create New Set' : 'Add Players'}
          </button>
          
          {/* Recovery Button */}
          <div className="mt-4">
            <button
              onClick={checkLocalStorageForRecovery}
              className="button-3d bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-2 px-4 rounded-lg shadow-3d text-sm"
            >
              📦 Recover Data from localStorage
        </button>
            <div className="text-white opacity-60 text-xs mt-2">
              Check if your saved data is in localStorage
            </div>
          </div>

          {allPlayers.length > 0 && allPlayers.length < 4 && (
            <div className="mt-4 text-white opacity-75 text-sm">
              Default players have been created. You can edit their names in the Player Inventory.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[100dvh] flex flex-col ${currentBgColor} relative`}>
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

      {/* Data Recovery Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-3d p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Recover Data from localStorage</h2>
            
            {recoveryStatus === 'found' && (
              <>
                <p className="text-gray-700 mb-4">
                  We found data in your browser's localStorage that hasn't been uploaded to MongoDB yet.
                  Would you like to upload it now?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleRecoveryUpload}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow-3d hover:shadow-3d-hover button-3d"
                  >
                    Upload to MongoDB
                  </button>
                  <button
                    onClick={() => setShowRecoveryModal(false)}
                    className="flex-1 bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg shadow-3d hover:shadow-3d-hover button-3d"
                  >
                    Skip
                  </button>
                </div>
              </>
            )}

            {recoveryStatus === 'uploading' && (
              <div className="text-center py-4">
                <div className="text-4xl mb-4 animate-spin">⏳</div>
                <p className="text-gray-700">Uploading data to MongoDB...</p>
              </div>
            )}

            {recoveryStatus === 'success' && (
              <div className="text-center py-4">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-gray-700 mb-4">Data uploaded successfully! Reloading page...</p>
              </div>
            )}

            {recoveryStatus === 'error' && (
              <>
                <div className="text-center py-4">
                  <div className="text-4xl mb-4">❌</div>
                  <p className="text-red-700 mb-4">
                    Failed to upload data: {recoveryError || 'Unknown error'}
                  </p>
                </div>
                <button
                  onClick={() => setShowRecoveryModal(false)}
                  className="w-full bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg shadow-3d hover:shadow-3d-hover button-3d"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
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
      {showAdmin && !showPlayerInventory && currentSet && (
        <AdminPanel
          playerSet={currentSet}
          allPlayers={allPlayers}
          playerSets={playerSets}
          currentSetIndex={currentSetIndex}
          onUpdateSet={handleUpdateSet}
          onUpdateAllPlayers={handleUpdateAllPlayers}
          onClose={() => setShowAdmin(false)}
          onAddNewSet={handleCreateSet}
          onOpenPlayerInventory={() => {
            setShowAdmin(false);
            setShowPlayerInventory(true);
          }}
          onSetChange={handleSetChange}
          onDeleteSet={handleDeleteSet}
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

      {/* Main Players View with Swipe Animation */}
      {!showAdmin && !showPlayerInventory && (
        <div className="flex-1 flex flex-col relative z-10 min-h-0 overflow-hidden">
          {/* Swipeable Container */}
          <div
            ref={swipeContainerRef}
            className="flex-1 flex relative w-full overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `translateX(${swipeOffset}%)`,
              transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Render all sets in a horizontal row */}
            {playerSets.map((set, index) => {
              const offset = (index - currentSetIndex) * 100;
              return (
                <div
                  key={set.id}
                  className="absolute inset-0 w-full flex flex-col"
                  style={{
                    transform: `translateX(${offset + swipeOffset}%)`,
                    transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div 
                    ref={(el) => {
                      if (el) {
                        scrollableContainerRefs.current.set(index, el);
                      } else {
                        scrollableContainerRefs.current.delete(index);
                      }
                    }}
                    className="flex-1 flex flex-col relative z-10 min-h-0 overflow-y-auto"
                  >
                    <PlayersView 
                      players={calculatePlayerStatsForSet(set.playerIds, allPlayers, set.gameEntries)} 
                      gameEntries={set.gameEntries}
                      onAddGameClick={handleAddGameClick}
                      onAdminClick={handleAdminClick}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Game Entry Form Modal */}
      {showGameForm && currentSet && !showAdmin && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm pointer-events-auto overflow-y-auto">
          <div className="relative z-50 min-h-full bg-gradient-to-br from-purple-100 via-pink-50 to-purple-100 p-4">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl p-6 shadow-3d">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Add New Game</h2>
      <button
                    onClick={() => setShowGameForm(false)}
                    className="button-3d p-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
      >
                    <span className="text-xl">✕</span>
      </button>
                </div>
                <GameEntryForm
                  players={resolvePlayers(currentSet.playerIds)}
                  onSave={handleSaveGameFromMain}
                  onCancel={() => setShowGameForm(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;