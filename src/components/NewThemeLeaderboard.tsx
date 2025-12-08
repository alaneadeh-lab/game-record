import React from 'react';
import { PodiumNewTheme } from './PodiumNewTheme';
import { StatsPanelNewTheme } from './StatsPanelNewTheme';
import { MedalsTableNewTheme } from './MedalsTableNewTheme';
import type { Player, GameEntry } from '../types';

interface NewThemeLeaderboardProps {
  players: Player[];
  gameEntries?: GameEntry[];
}

export const NewThemeLeaderboard: React.FC<NewThemeLeaderboardProps> = ({ 
  players, 
  gameEntries: _gameEntries = [],
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#5A00B8] via-[#40009C] to-[#25005F] relative overflow-hidden">
      {/* Floating particle effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Blurred colored circles */}
        <div className="absolute top-10 left-10 w-16 h-16 bg-yellow-400 rounded-full opacity-20 blur-xl animate-pulse" />
        <div className="absolute top-20 right-20 w-20 h-20 bg-pink-400 rounded-full opacity-15 blur-xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-20 left-1/4 w-14 h-14 bg-blue-400 rounded-full opacity-20 blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/3 w-18 h-18 bg-green-400 rounded-full opacity-15 blur-xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/3 w-12 h-12 bg-purple-300 rounded-full opacity-20 blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/3 right-1/4 w-16 h-16 bg-orange-400 rounded-full opacity-15 blur-xl animate-pulse" style={{ animationDelay: '2.5s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 pt-6 pb-8 px-4 sm:px-6">
        {/* Title - منصة التتويج */}
        <div className="text-center mb-6">
          <h1 
            className="text-4xl sm:text-5xl font-black"
            style={{
              color: '#FFD700',
              textShadow: '0 0 20px rgba(255,215,0,0.8), 0 4px 8px rgba(0,0,0,0.5)',
            }}
          >
            منصة التتويج
          </h1>
        </div>

        {/* Podium Section - Only showing 1st, 2nd, and 4th */}
        <PodiumNewTheme players={players} />

        {/* Fatts Section - قته */}
        <div className="mt-8 sm:mt-10">
          <StatsPanelNewTheme players={players} />
        </div>

        {/* Medals Table */}
        <div className="mt-8 sm:mt-10">
          <MedalsTableNewTheme players={players} />
        </div>
      </div>
    </div>
  );
};

