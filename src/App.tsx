import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { PlayersView } from './components/PlayersView';
import { AdminPanel } from './components/AdminPanel';
import { SetManagerModal } from './components/SetManagerModal';
import { PlayerInventory } from './components/PlayerInventory';
import { PlayerSetSelector } from './components/PlayerSetSelector';
import { GameEntryForm } from './components/GameEntryForm';
import { storageService, checkLocalStorageStatus } from './services/storageService';
import { calculatePlayerStatsForSet, getWinScoreLimit } from './utils/gameLogic';
import { checkLocalStorageData, uploadLocalStorageToMongoDB } from './utils/dataRecovery';
import type { PlayerSet, Player, AppData, GameEntry } from './types';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [playerSets, setPlayerSets] = useState<PlayerSet[]>([]);
  const [deletedSetIds, setDeletedSetIds] = useState<string[]>([]);
  const [dataVersion, setDataVersion] = useState<number>(1);
  const [legacySetWinsByPlayerId, setLegacySetWinsByPlayerId] = useState<Record<string, number>>({});
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

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      // Ctrl/Cmd + G to quickly add game
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (!showAdmin && !showPlayerInventory && !showGameForm) {
          handleAddGameClick();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyPress);
    return () => document.removeEventListener('keydown', handleGlobalKeyPress);
  }, [showAdmin, showPlayerInventory, showGameForm]);
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
        
        // FORENSIC LOG: One-time forensic log on app load
        const useMongoDB = import.meta.env.VITE_API_URL !== undefined;
        const apiUrl = import.meta.env.VITE_API_URL;
        const userId = import.meta.env.VITE_USER_ID || 'default';
        
        console.log('🔍 [FORENSIC] App Load Forensic Log:', {
          timestamp: new Date().toISOString(),
          persistenceMode: useMongoDB ? 'MongoDB' : 'localStorage',
          viteApiUrl: apiUrl || 'NOT DEFINED',
          viteApiUrlDefined: apiUrl !== undefined,
          userId: userId,
        });
        
        // Scan localStorage for all keys
        const localStorageKeys: string[] = [];
        const legacyKeys: any[] = [];
        const searchTerms = ['hand', 'game', 'record', 'app-data', 'tracker', 'save'];
        
        if (typeof localStorage !== 'undefined') {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              localStorageKeys.push(key);
              
              // Check if key contains any search terms
              const keyLower = key.toLowerCase();
              if (searchTerms.some(term => keyLower.includes(term))) {
                try {
                  const value = localStorage.getItem(key);
                  if (value) {
                    try {
                      const parsed = JSON.parse(value);
                      // Check if it looks like appData
                      if (parsed && typeof parsed === 'object') {
                        const hasPlayers = Array.isArray(parsed.allPlayers) || Array.isArray(parsed.players);
                        const hasSets = Array.isArray(parsed.sets) || Array.isArray(parsed);
                        if (hasPlayers || hasSets) {
                          const sets = parsed.sets || parsed;
                          const players = parsed.allPlayers || parsed.players || [];
                          const totalGameEntries = Array.isArray(sets) ? sets.reduce((sum: number, set: any) => 
                            sum + (Array.isArray(set.gameEntries) ? set.gameEntries.length : 0), 0) : 0;
                          
                          legacyKeys.push({
                            key: key,
                            hasPlayers: hasPlayers,
                            hasSets: hasSets,
                            playersCount: Array.isArray(players) ? players.length : 0,
                            setsCount: Array.isArray(sets) ? sets.length : 0,
                            totalGameEntries: totalGameEntries,
                            size: value.length,
                          });
                        }
                      }
                    } catch (e) {
                      // Not JSON, skip
                    }
                  }
                } catch (e) {
                  // Error reading, skip
                }
              }
            }
          }
        }
        
        // Check current localStorage key
        const currentStorageKey = 'game-record-data';
        const currentStorageData = typeof localStorage !== 'undefined' ? localStorage.getItem(currentStorageKey) : null;
        let currentStorageCounts = null;
        if (currentStorageData) {
          try {
            const parsed = JSON.parse(currentStorageData);
            if (parsed && typeof parsed === 'object') {
              const sets = parsed.sets || [];
              const players = parsed.allPlayers || [];
              const totalGameEntries = Array.isArray(sets) ? sets.reduce((sum: number, set: any) => 
                sum + (Array.isArray(set.gameEntries) ? set.gameEntries.length : 0), 0) : 0;
              
              currentStorageCounts = {
                playersCount: Array.isArray(players) ? players.length : 0,
                setsCount: Array.isArray(sets) ? sets.length : 0,
                totalGameEntries: totalGameEntries,
              };
            }
          } catch (e) {
            // Not valid JSON
          }
        }
        
        console.log('🔍 [FORENSIC] localStorage Analysis:', {
          allLocalStorageKeys: localStorageKeys,
          currentStorageKey: currentStorageKey,
          currentStorageExists: !!currentStorageData,
          currentStorageCounts: currentStorageCounts,
          legacyKeysFound: legacyKeys,
        });
        
        console.log('🔄 Loading app data...');
        const appData = await storageService.loadAppData();
        
        console.log('📦 Loaded data structure:', {
          playersCount: appData.allPlayers?.length || 0,
          setsCount: appData.sets?.length || 0,
          hasPlayers: !!appData.allPlayers,
          hasSets: !!appData.sets,
          playersType: typeof appData.allPlayers,
          setsType: typeof appData.sets,
        });

        // Handle case where no data exists
        if (!appData.allPlayers || appData.allPlayers.length === 0) {
          console.log('⚠️ No players found, creating default players');
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
            winScoreLimit: 50,
          };

          setAllPlayers(defaultPlayers);
          setPlayerSets([defaultSet]);

          // Save default data
          await storageService.saveAppData({
            allPlayers: defaultPlayers,
            sets: [defaultSet],
          });
        } else {
          // NORMALIZE: Convert legacy playerSets to sets if present
          let normalizedSets: PlayerSet[] = [];
          if (appData.sets && Array.isArray(appData.sets)) {
            normalizedSets = appData.sets;
          } else if ((appData as any).playerSets && Array.isArray((appData as any).playerSets)) {
            console.log('🔄 [NORMALIZE] Converting legacy playerSets to sets');
            normalizedSets = (appData as any).playerSets;
          }
          
          // Ensure all sets have gameEntries array and winScoreLimit (migration default 50)
          normalizedSets = normalizedSets.map(set => ({
            ...set,
            gameEntries: Array.isArray(set.gameEntries) ? set.gameEntries : [],
            winScoreLimit: typeof set.winScoreLimit === 'number' && set.winScoreLimit >= 1 && set.winScoreLimit <= 9999
              ? Math.floor(set.winScoreLimit)
              : 50,
            winScoreLabel: set.winScoreLabel,
          }));
          
          // Load deletedSetIds, dataVersion, legacySetWinsByPlayerId
          // Ensure dataVersion defaults to 0 if missing (not 1, to allow first write)
          const loadedDeletedSetIds = Array.isArray(appData.deletedSetIds) ? appData.deletedSetIds : [];
          const loadedDataVersion = typeof appData.dataVersion === 'number' ? appData.dataVersion : 0;
          
          // FILTER: Remove deleted sets
          const setsBeforeFilter = normalizedSets.length;
          const filteredSets = normalizedSets.filter(set => !loadedDeletedSetIds.includes(set.id));
          const setsAfterFilter = filteredSets.length;
          
          console.log('🗑️ [DELETE] Filtering deleted sets on load:', {
            deletedSetIdsCount: loadedDeletedSetIds.length,
            deletedSetIds: loadedDeletedSetIds.slice(0, 5), // First 5 for diagnostics
            setsBeforeFilter: setsBeforeFilter,
            setsAfterFilter: setsAfterFilter,
            filteredOut: setsBeforeFilter - setsAfterFilter,
          });
          
          setDeletedSetIds(loadedDeletedSetIds);
          setDataVersion(loadedDataVersion);
          setLegacySetWinsByPlayerId(
            appData.legacySetWinsByPlayerId && typeof appData.legacySetWinsByPlayerId === 'object'
              ? appData.legacySetWinsByPlayerId
              : {}
          );
          
          // Data exists, use it
          const totalGames = filteredSets.reduce((sum: number, set: any) => 
            sum + (Array.isArray(set.gameEntries) ? set.gameEntries.length : 0), 0) || 0;
          
          console.log('✅ Using loaded data:', {
            players: appData.allPlayers.length,
            sets: filteredSets.length,
            totalGameEntries: totalGames,
            setsWithGames: filteredSets.map((s: any) => ({
              name: s.name,
              gameCount: Array.isArray(s.gameEntries) ? s.gameEntries.length : 0,
            })),
          });
          
          // Warn if no game entries found
          if (totalGames === 0 && filteredSets.length > 0) {
            // DIAGNOSTIC: Expanded warning with detailed info
            const searchedKey = 'sets[].gameEntries';
            const appDataKeys = Object.keys(appData);
            const setsKeys = filteredSets.length > 0 ? Object.keys(filteredSets[0]) : [];
            
            console.warn('⚠️ WARNING: Data loaded but NO GAME ENTRIES found!', {
              // What we searched for
              searchedKey: searchedKey,
              expectedLocation: 'appData.sets[].gameEntries',
              
              // What keys actually exist
              appDataKeys: appDataKeys,
              firstSetKeys: setsKeys,
              
              // Data preview
              playersCount: appData.allPlayers?.length || 0,
              setsCount: filteredSets.length,
              totalGameEntries: totalGames,
              
              // Detailed set analysis
              allSets: filteredSets.map((s: any) => ({
                name: s.name,
                id: s.id,
                setKeys: Object.keys(s),
                hasGameEntries: 'gameEntries' in s,
                gameEntriesType: typeof s.gameEntries,
                gameEntriesIsArray: Array.isArray(s.gameEntries),
                gameEntriesLength: Array.isArray(s.gameEntries) ? s.gameEntries.length : 'N/A',
                // Check for alternative keys
                hasGames: 'games' in s,
                hasEntries: 'entries' in s,
                hasRecords: 'records' in s,
                hasRounds: 'rounds' in s,
                hasHistory: 'history' in s,
                hasHands: 'hands' in s,
                hasEvents: 'events' in s,
              })),
            });
            console.log('💡 Tip: Run fetch("/api/app-data/diagnostic").then(r=>r.json()).then(console.log) to see full diagnostic info');
          }
          
          setAllPlayers(appData.allPlayers);
          setPlayerSets(filteredSets); // Use filtered sets (deleted ones removed)
          
          // If we have players but no sets, create a default set
          if (filteredSets.length === 0) {
            console.log('⚠️ No sets found but players exist, creating default set');
          const defaultSet: PlayerSet = {
            id: uuidv4(),
            name: 'Default Set',
            playerIds: appData.allPlayers.slice(0, 4).map(p => p.id),
            gameEntries: [],
            winScoreLimit: 50,
          };
            setPlayerSets([defaultSet]);
          } else {
            setPlayerSets(appData.sets);
          }
        }
      } catch (error) {
        console.error('❌ Failed to load data:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
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
          winScoreLimit: 50,
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
        // NORMALIZE: Convert playerSets to sets, ensure gameEntries and winScoreLimit present
        const normalizedSets: PlayerSet[] = playerSets.map(set => ({
          id: set.id,
          name: set.name,
          playerIds: Array.isArray(set.playerIds) ? set.playerIds : [],
          gameEntries: Array.isArray(set.gameEntries) ? set.gameEntries : [],
          winScoreLimit: typeof set.winScoreLimit === 'number' && set.winScoreLimit >= 1 && set.winScoreLimit <= 9999
            ? Math.floor(set.winScoreLimit)
            : 50,
          winScoreLabel: set.winScoreLabel,
        }));
        
        // Create normalized AppData payload (NO playerSets field)
        const appData: AppData = {
          allPlayers,
          sets: normalizedSets,
          deletedSetIds: deletedSetIds,
          dataVersion: dataVersion,
          legacySetWinsByPlayerId: Object.keys(legacySetWinsByPlayerId).length ? legacySetWinsByPlayerId : undefined,
        };
        
        // VALIDATION: Ensure gameEntries are included in payload
        const totalGameEntriesInMemory = playerSets.reduce((sum, set) => 
          sum + (Array.isArray(set.gameEntries) ? set.gameEntries.length : 0), 0);
        const totalGameEntriesInPayload = appData.sets.reduce((sum, set) => 
          sum + (Array.isArray(set.gameEntries) ? set.gameEntries.length : 0), 0);
        
        // CRITICAL: If we have gameEntries in memory but payload is missing them, BLOCK save
        if (totalGameEntriesInMemory > 0 && totalGameEntriesInPayload === 0) {
          console.error('🚫 [BLOCKED] Save prevented: gameEntries exist in memory but missing from payload!', {
            totalGameEntriesInMemory,
            totalGameEntriesInPayload,
            playerSetsGameEntries: playerSets.map(s => ({
              setId: s.id,
              setName: s.name,
              count: Array.isArray(s.gameEntries) ? s.gameEntries.length : 0,
              gameEntriesType: typeof s.gameEntries,
              gameEntriesIsArray: Array.isArray(s.gameEntries),
            })),
            payloadSetsGameEntries: appData.sets.map(s => ({
              setId: s.id,
              setName: s.name,
              count: Array.isArray(s.gameEntries) ? s.gameEntries.length : 0,
              gameEntriesType: typeof s.gameEntries,
              gameEntriesIsArray: Array.isArray(s.gameEntries),
            })),
          });
          setSaveStatus('error');
          setTimeout(() => {
            alert('⚠️ Save blocked: Game entries exist but were not included in save payload. This is a bug - please report it.');
          }, 100);
          return;
        }
        
        // DIAGNOSTIC: Log what we're about to save
        const allPlayersWithZeros = allPlayers.filter(p => p.points === 0 && p.fatts === 0 && p.goldMedals === 0 && p.silverMedals === 0 && p.bronzeMedals === 0).length;
        const isBlankTemplate = allPlayers.length > 0 && allPlayersWithZeros === allPlayers.length && totalGameEntriesInPayload === 0;
        
        console.log('💾 [DIAGNOSTIC] Client-side save triggered:', {
          persistenceMethod: 'MongoDB (via storageService.saveAppData)',
          appDataKeys: Object.keys(appData),
          allPlayersCount: appData.allPlayers.length,
          setsCount: appData.sets.length,
          totalGameEntries: totalGameEntriesInPayload,
          gameEntriesPerSet: appData.sets.map(s => ({
            setId: s.id,
            setName: s.name,
            gameEntriesCount: Array.isArray(s.gameEntries) ? s.gameEntries.length : 0,
          })),
          allPlayersWithZeros: allPlayersWithZeros,
          isBlankTemplate: isBlankTemplate,
          warning: isBlankTemplate ? '⚠️ WARNING: This looks like a blank template (all players have zeros, no game entries)!' : null,
        });
        
        let saveResult = await storageService.saveAppData(appData);

        if (!saveResult.ok && saveResult.code === 'destructive_write_blocked') {
          console.warn('🔄 [RETRY] Delete blocked by safety guard. Retrying as destructive delete...');
          alert('Delete blocked by safety guard. Retrying as destructive delete...');
          saveResult = await storageService.saveAppData(appData, { allowDestructive: true });
          if (!saveResult.ok) {
            console.error('❌ [RETRY] Destructive save failed:', saveResult);
            setSaveStatus('error');
            setTimeout(() => {
              alert(saveResult.message || 'Save failed after retry. Please try again.');
            }, 100);
          } else {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
          }
          return;
        }
        
        if (!saveResult.ok && saveResult.code === 'stale_write_rejected') {
          console.warn('🔄 [RETRY] Stale write detected, refetching and retrying...');
          
          // Refetch latest data
          const freshData = await storageService.loadAppData();
          
          // Merge local pending changes (especially deletedSetIds) into fresh data
          const mergedDeletedSetIds = Array.from(new Set([
            ...(freshData.deletedSetIds || []),
            ...deletedSetIds,
          ]));
          
          // Use higher version + 1
          const mergedDataVersion = Math.max(freshData.dataVersion || 0, dataVersion) + 1;
          
          // Merge sets: start with fresh, overlay local changes
          const localSetIds = new Set(playerSets.map(s => s.id));
          const mergedSets = [
            ...freshData.sets.filter(s => !mergedDeletedSetIds.includes(s.id) && !localSetIds.has(s.id)),
            ...normalizedSets.filter(s => !mergedDeletedSetIds.includes(s.id)),
          ];
          
          // Update state with merged data
          setAllPlayers(freshData.allPlayers);
          setPlayerSets(mergedSets);
          setDeletedSetIds(mergedDeletedSetIds);
          setDataVersion(mergedDataVersion);
          setLegacySetWinsByPlayerId(freshData.legacySetWinsByPlayerId ?? {});
          
          // Retry save with merged data
          const retryAppData: AppData = {
            allPlayers: freshData.allPlayers,
            sets: mergedSets,
            deletedSetIds: mergedDeletedSetIds,
            dataVersion: mergedDataVersion,
          };
          
          const retryResult = await storageService.saveAppData(retryAppData);
          
          if (!retryResult.ok) {
            console.error('❌ [RETRY] Retry save failed:', retryResult);
            setSaveStatus('error');
            setTimeout(() => {
              alert('⚠️ Save conflict. Please refresh the page.');
            }, 100);
          } else {
            console.log('✅ [RETRY] Retry save succeeded');
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
          }
        } else if (!saveResult.ok) {
          console.error('❌ Failed to save data:', saveResult);
          setSaveStatus('error');
          
          // Handle blocked save response from server
          if (saveResult.code === 'blocked_blank_overwrite') {
            setTimeout(() => {
              alert('⚠️ Save blocked: Server prevented overwriting existing game history with blank template.');
            }, 100);
          } else {
            setTimeout(() => {
              alert(`Failed to save: ${saveResult.message || 'Something went wrong. Please try again.'}`);
            }, 100);
          }
        } else {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        }
      } catch (error: any) {
        console.error('❌ Failed to save data:', error);
        setSaveStatus('error');
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          setTimeout(() => {
            alert('⚠️ Storage quota exceeded!\n\nYour data is too large to save. Please:\n- Remove some player photos\n- Use smaller images\n- Clear browser cache');
          }, 100);
        } else {
          setTimeout(() => {
            alert(`Failed to save: ${error?.message || 'Something went wrong. Please try again.'}`);
          }, 100);
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [allPlayers, playerSets, deletedSetIds, dataVersion, legacySetWinsByPlayerId, isLoading]);

  const handleUpdateSet = useCallback((updatedSet: PlayerSet) => {
    setPlayerSets(prev => {
      const updated = [...prev];
      updated[currentSetIndex] = { ...updatedSet };
      return updated;
    });
  }, [currentSetIndex]);

  const handleDeleteGameEntry = useCallback(async (setId: string, entryId: string) => {
    const prevSets = playerSets;
    const set = prevSets.find(s => s.id === setId);
    if (!set || !set.gameEntries.some(e => e.id === entryId)) return;

    const beforeCount = set.gameEntries.length;
    setPlayerSets(prev =>
      prev.map(s =>
        s.id !== setId
          ? s
          : { ...s, gameEntries: s.gameEntries.filter(e => e.id !== entryId) }
      )
    );
    const afterCount = beforeCount - 1;
    console.log('🗑️ [DELETE ENTRY] Client:', { setId, entryId, beforeCount, afterCount });

    if (typeof storageService.deleteGameEntry === 'function') {
      const result = await storageService.deleteGameEntry(setId, entryId);
      if (!result.ok) {
        setPlayerSets(prevSets);
        const msg =
          result.code === 'entry_not_found' || result.code === 'set_not_found'
            ? 'Game entry or set no longer exists.'
            : result.code === 'not_found'
              ? 'Data not found on server.'
              : result.message || 'Delete failed. Please try again.';
        alert(msg);
        return;
      }
      if (typeof result.dataVersion === 'number') {
        setDataVersion(result.dataVersion);
      }
    }
  }, [playerSets]);

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

  const handleDeleteSet = useCallback(async () => {
    if (playerSets.length <= 1) {
      alert('Cannot delete the last set. You must have at least one set.');
      return;
    }
    
    const setToDelete = playerSets[currentSetIndex];
    if (!setToDelete) return;
    
    // Store before state for diagnostics
    const beforeDeletedSetIdsLength = deletedSetIds.length;
    
    // Remove from visible sets
    const newSets = playerSets.filter((_, index) => index !== currentSetIndex);
    setPlayerSets(newSets);
    
    // Adjust current index if needed
    if (currentSetIndex >= newSets.length) {
      setCurrentSetIndex(newSets.length - 1);
    }
    
    // Track deletion in deletedSetIds
    let updatedDeletedSetIds: string[];
    if (deletedSetIds.includes(setToDelete.id)) {
      updatedDeletedSetIds = deletedSetIds; // Already deleted
    } else {
      updatedDeletedSetIds = [...deletedSetIds, setToDelete.id];
    }
    setDeletedSetIds(updatedDeletedSetIds);
    
    // Increment dataVersion to prevent stale saves
    const newDataVersion = dataVersion + 1;
    setDataVersion(newDataVersion);
    
    console.log('🗑️ [DELETE] Set marked for deletion:', {
      deletedSetId: setToDelete.id,
      deletedSetName: setToDelete.name,
      beforeDeletedSetIdsLength: beforeDeletedSetIdsLength,
      afterDeletedSetIdsLength: updatedDeletedSetIds.length,
      outgoingDataVersion: newDataVersion,
      deletedSetIds: updatedDeletedSetIds.slice(0, 5), // First 5 for diagnostics
    });
    
    // Immediately save with updated data
    try {
      const normalizedSets: PlayerSet[] = newSets.map(set => ({
        id: set.id,
        name: set.name,
        playerIds: Array.isArray(set.playerIds) ? set.playerIds : [],
        gameEntries: Array.isArray(set.gameEntries) ? set.gameEntries : [],
      }));
      
      const appData: AppData = {
        allPlayers,
        sets: normalizedSets,
        deletedSetIds: updatedDeletedSetIds,
        dataVersion: newDataVersion,
        legacySetWinsByPlayerId: Object.keys(legacySetWinsByPlayerId).length ? legacySetWinsByPlayerId : undefined,
      };
      
      const saveResult = await storageService.saveAppData(appData);
      
      if (!saveResult.ok && saveResult.code === 'stale_write_rejected') {
        console.warn('🔄 [RETRY] Stale write on delete, refetching and retrying...');
        
        // Refetch latest data
        const freshData = await storageService.loadAppData();
        
        // Merge: union deletedSetIds, use higher version
        const mergedDeletedSetIds = Array.from(new Set([...updatedDeletedSetIds, ...(freshData.deletedSetIds || [])]));
        const mergedDataVersion = Math.max(freshData.dataVersion || 0, newDataVersion) + 1;
        
        // Update state with fresh data but preserve our deletion
        setAllPlayers(freshData.allPlayers);
        setPlayerSets(freshData.sets.filter(set => !mergedDeletedSetIds.includes(set.id)));
        setDeletedSetIds(mergedDeletedSetIds);
        setDataVersion(mergedDataVersion);
        setLegacySetWinsByPlayerId(freshData.legacySetWinsByPlayerId ?? {});
        
        // Retry save with merged data
        const retryAppData: AppData = {
          allPlayers: freshData.allPlayers,
          sets: freshData.sets.filter(set => !mergedDeletedSetIds.includes(set.id)),
          deletedSetIds: mergedDeletedSetIds,
          dataVersion: mergedDataVersion,
          legacySetWinsByPlayerId: freshData.legacySetWinsByPlayerId,
        };
        
        const retryResult = await storageService.saveAppData(retryAppData);
        
        if (!retryResult.ok) {
          console.error('❌ [DELETE] Retry save failed:', retryResult);
          alert('⚠️ Save conflict. Please refresh the page.');
        } else {
          console.log('✅ [DELETE] Retry save succeeded');
        }
      } else if (!saveResult.ok) {
        console.error('❌ [DELETE] Save failed:', saveResult);
        alert(`Failed to save deletion: ${saveResult.message || 'Something went wrong. Please try again.'}`);
      } else {
        console.log('✅ [DELETE] Save succeeded immediately');
      }
    } catch (error) {
      console.error('❌ [DELETE] Error during save:', error);
      alert('Failed to save deletion. Please try again.');
    }
  }, [currentSetIndex, playerSets, deletedSetIds, dataVersion, allPlayers]);

  const handleReorderSets = useCallback((newSets: PlayerSet[]) => {
    setPlayerSets(newSets);
    // Update current set index if the current set moved
    const currentSetId = playerSets[currentSetIndex]?.id;
    const newIndex = newSets.findIndex(set => set.id === currentSetId);
    if (newIndex !== -1 && newIndex !== currentSetIndex) {
      setCurrentSetIndex(newIndex);
    }
  }, [currentSetIndex, playerSets]);

  const handleSaveNewSet = useCallback((playerIds: string[], winScoreLimit?: number) => {
    setPlayerSets((prev) => {
      const limit = typeof winScoreLimit === 'number' && winScoreLimit >= 1 && winScoreLimit <= 9999
        ? Math.floor(winScoreLimit)
        : 50;
      const newSet: PlayerSet = {
        id: Date.now().toString(),
        name: `Set ${prev.length + 1}`,
        playerIds,
        gameEntries: [],
        winScoreLimit: limit,
      };
      const newSets = [...prev, newSet];
      setCurrentSetIndex(newSets.length - 1);
      return newSets;
    });
    setDataVersion(prev => prev + 1);
    setShowNewSetSelector(false);
  }, []);

  const handleSetChange = useCallback((index: number) => {
    if (index >= 0 && index < playerSets.length) {
      setCurrentSetIndex(index);
    }
  }, [playerSets.length]);

  // Stars: legacy only for now (Asim +2); no computed set wins
  const totalStarsByPlayerId = useMemo(() => ({ ...legacySetWinsByPlayerId }), [legacySetWinsByPlayerId]);

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

    // DIAGNOSTIC: Log game entry being recorded
    const updatedGameEntries = [...set.gameEntries, newEntry];
    console.log('🎮 [DIAGNOSTIC] Game entry recorded:', {
      memoryPath: `playerSets[${currentSetIndex}].gameEntries`,
      beforeCount: set.gameEntries.length,
      afterCount: updatedGameEntries.length,
      newEntryId: newEntry.id,
      newEntryDate: newEntry.date,
      setId: set.id,
      setName: set.name,
      totalGameEntriesInMemory: updatedGameEntries.length,
      allSetsGameEntriesCount: playerSets.map(s => s.gameEntries.length),
    });

    // Update the set with new game entry (stats are calculated per-set on display)
    const updatedSet = {
      ...set,
      gameEntries: updatedGameEntries,
    };
    
    console.log('💾 [DIAGNOSTIC] About to call handleUpdateSet, which will trigger save effect');
    handleUpdateSet(updatedSet);
    
    // Increment dataVersion on mutation (adding game entry)
    setDataVersion(prev => prev + 1);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-800 via-green-900 to-emerald-900 relative">
        {/* Admin Button - Fixed position */}
        <button
          onClick={handleAdminClick}
          className="fixed top-4 right-4 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full shadow-3d hover:shadow-3d-hover flex items-center justify-center button-3d z-50"
          aria-label="Open admin"
          title="Admin Tools"
        >
          <Settings className="w-7 h-7" />
        </button>

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

        {/* Admin Panel - Show even when no set exists */}
        {showAdmin && (
          <AdminPanel
            playerSet={{
              id: 'temp',
              name: 'No Set Selected',
              playerIds: allPlayers.slice(0, 4).map(p => p.id),
              gameEntries: [],
              winScoreLimit: 50,
            }}
            allPlayers={allPlayers}
            playerSets={playerSets}
            currentSetIndex={0}
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
            onReorderSets={handleReorderSets}
            onDeleteGameEntry={handleDeleteGameEntry}
          />
        )}
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
          showWinLimit
          defaultWinScoreLimit={50}
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
            onReorderSets={handleReorderSets}
            onDeleteGameEntry={handleDeleteGameEntry}
        />
      )}

      {/* Set Manager Modal */}
      {showSetMenu && (
        <SetManagerModal
          playerSets={playerSets}
          allPlayers={allPlayers}
          currentSetIndex={currentSetIndex}
          onSetChange={handleSetChange}
          onReorderSets={handleReorderSets}
          onCreateSet={handleCreateSet}
          onDeleteSet={handleDeleteSet}
          onClose={() => setShowSetMenu(false)}
        />
      )}

      {/* Main Players View with Swipe Animation */}
      {!showAdmin && !showPlayerInventory && (
        <div className="flex-1 flex flex-col relative z-10 min-h-0 overflow-hidden">
          {/* Navigation Controls */}
          {playerSets.length > 1 && (
            <div className="flex items-center justify-between px-4 py-2 bg-black/20 backdrop-blur-sm">
              <button
                onClick={handleSwipeRight}
                disabled={currentSetIndex === 0}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              
              {/* Set Indicators */}
              <div className="flex space-x-2">
                {playerSets.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleSetChange(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentSetIndex
                        ? 'bg-white'
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
              
              <button
                onClick={handleSwipeLeft}
                disabled={currentSetIndex === playerSets.length - 1}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
          
          {/* Swipeable Container */}
          <div
            ref={swipeContainerRef}
            className="flex-1 flex relative w-full overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `translate3d(${swipeOffset}%, 0, 0)`,
              transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: isSwiping ? 'transform' : 'auto',
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
                    transform: `translate3d(${offset + swipeOffset}%, 0, 0)`,
                    transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: isSwiping ? 'transform' : 'auto',
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
                      winScoreLimit={getWinScoreLimit(set)}
                      totalStarsByPlayerId={totalStarsByPlayerId}
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

      {/* Floating Quick Add Game Button */}
      {!showAdmin && !showPlayerInventory && !showGameForm && (
        <button
          onClick={handleAddGameClick}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full shadow-3d hover:shadow-3d-hover flex items-center justify-center button-3d animate-pulse"
          aria-label="Quick add game"
          title="Quick Add Game (Ctrl+G)"
        >
          <Plus className="w-10 h-10" />
        </button>
      )}

    </div>
  );
}

export default App;