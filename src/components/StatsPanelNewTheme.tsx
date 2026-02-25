import React from 'react';
import { getPlayerRank } from '../utils/gameLogic';
import type { Player } from '../types';

const STAR_CAP = 10;

interface StatsPanelNewThemeProps {
  players: Player[];
  totalStarsByPlayerId?: Record<string, number>;
}

export const StatsPanelNewTheme: React.FC<StatsPanelNewThemeProps> = ({
  players,
  totalStarsByPlayerId = {},
}) => {
  const ranks = getPlayerRank(players);
  const sortedPlayers = [...players].sort((a, b) => ranks[a.id] - ranks[b.id]);

  return (
    <div className="w-full">
      {/* قته Title with Icons */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {/* Golden Crown Icon */}
        <div className="text-4xl sm:text-5xl">👑</div>
        
        {/* قته Text */}
        <h2 
          className="text-4xl sm:text-5xl font-black"
          style={{
            color: '#FFD700',
            textShadow: '0 0 20px rgba(255,215,0,0.8), 0 4px 8px rgba(0,0,0,0.5)',
          }}
        >
          قته
        </h2>
        
        {/* Domino and Card Icons */}
        <div className="flex gap-2">
          <div className="text-3xl sm:text-4xl">🎲</div>
          <div className="text-3xl sm:text-4xl">🃏</div>
        </div>
      </div>

      {/* Score Cards */}
      <div className="bg-gradient-to-br from-purple-600/90 to-purple-800/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_2px_8px_rgba(255,255,255,0.1)]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {sortedPlayers.map((player) => {
            // Use fatts instead of points
            const value = player.fatts;
            
            return (
              <div
                key={player.id}
                className="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-purple-700/80 to-purple-900/80 border-2 border-purple-400/30 transition-all duration-300 hover:scale-105"
                style={{
                  boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                }}
              >
                <div className="mb-3 text-center">
                  <div
                    className="font-extrabold text-base sm:text-lg"
                    style={{
                      color: '#FFD700',
                      textShadow: '0 0 10px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.4)',
                    }}
                  >
                    {player.name}
                  </div>
                  {(totalStarsByPlayerId[player.id] ?? 0) > 0 && (
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(255,215,0,0.9)' }}>
                      {(totalStarsByPlayerId[player.id] ?? 0) <= STAR_CAP
                        ? '⭐'.repeat(totalStarsByPlayerId[player.id] ?? 0)
                        : `⭐ ×${totalStarsByPlayerId[player.id]}`}
                    </div>
                  )}
                </div>
                
                {/* Fatts (Large number) */}
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-black text-white drop-shadow-lg">
                    {value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

