import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Add global helper for debugging MongoDB data
if (typeof window !== 'undefined') {
  (window as any).checkMongoData = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5200/api';
    try {
      const response = await fetch(`${apiUrl}/app-data/diagnostic`);
      const data = await response.json();
      console.log('📊 MongoDB Diagnostic Data:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching diagnostic data:', error);
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
