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
    <div className="min-h-screen bg-gradient-to-br from-[#3A0CA3] via-[#560BAD] to-[#7209B7] relative overflow-hidden">
      {/* Animated background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Confetti-like particles */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-yellow-400 rounded-full opacity-60 animate-pulse" />
        <div className="absolute top-20 right-20 w-3 h-3 bg-pink-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-green-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 pt-8 pb-8 px-4 sm:px-6">
        {/* Podium Section */}
        <PodiumNewTheme players={players} />

        {/* Stats Panel */}
        <div className="mt-8">
          <StatsPanelNewTheme players={players} />
        </div>

        {/* Medals Table */}
        <div className="mt-8">
          <MedalsTableNewTheme players={players} />
        </div>
      </div>
    </div>
  );
};

