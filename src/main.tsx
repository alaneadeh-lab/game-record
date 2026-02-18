import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Add global helper for debugging MongoDB data
if (typeof window !== 'undefined') {
  (window as any).checkMongoData = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5200/api';
    try {
      // Try diagnostic endpoint first
      let response = await fetch(`${apiUrl}/app-data/diagnostic`);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 MongoDB Diagnostic Data:', data);
        return data;
      }
      // Fallback: use regular endpoint and analyze
      console.log('⚠️ Diagnostic endpoint not available, using regular endpoint...');
      response = await fetch(`${apiUrl}/app-data?userId=default`);
      const data = await response.json();
      console.log('📊 Raw MongoDB Data:', data);
      console.log('📊 Analysis:', {
        hasAllPlayers: !!data.allPlayers,
        hasSets: !!data.sets,
        playersCount: Array.isArray(data.allPlayers) ? data.allPlayers.length : 0,
        setsCount: Array.isArray(data.sets) ? data.sets.length : 0,
        setsDetails: Array.isArray(data.sets) ? data.sets.map((s: any) => ({
          name: s.name,
          id: s.id,
          playerIdsCount: Array.isArray(s.playerIds) ? s.playerIds.length : 0,
          gameEntriesCount: Array.isArray(s.gameEntries) ? s.gameEntries.length : 0,
          gameEntriesType: typeof s.gameEntries,
          gameEntriesIsArray: Array.isArray(s.gameEntries),
        })) : [],
        totalGameEntries: Array.isArray(data.sets) ? data.sets.reduce((sum: number, s: any) => 
          sum + (Array.isArray(s.gameEntries) ? s.gameEntries.length : 0), 0) : 0,
      });
      return data;
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      return null;
    }
  };
  console.log('💡 Debug helper available: Run checkMongoData() in console to inspect MongoDB data');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
