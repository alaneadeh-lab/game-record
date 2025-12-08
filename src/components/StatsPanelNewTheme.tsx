import React from 'react';
import { calculateMedalPoints } from '../utils/gameLogic';
import { getPlayerRank } from '../utils/gameLogic';
import type { Player } from '../types';

interface StatsPanelNewThemeProps {
  players: Player[];
}

export const StatsPanelNewTheme: React.FC<StatsPanelNewThemeProps> = ({ players }) => {
  const ranks = getPlayerRank(players);
  const sortedPlayers = [...players].sort((a, b) => ranks[a.id] - ranks[b.id]);

  // Color mapping for each player (by position)
  const getPlayerColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-700', // Jaafar (1st in sorted)
      'from-purple-500 to-purple-700', // Asim (2nd)
      'from-orange-500 to-orange-700', // Alaa (3rd)
      'from-green-500 to-green-700', // Malik (4th)
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-purple-600/80 to-purple-800/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_2px_8px_rgba(255,255,255,0.1)]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {sortedPlayers.map((player, index) => {
            const points = calculateMedalPoints(player);
            const isHighScore = index === 0; // First player has highest score
            
            return (
              <div
                key={player.id}
                className={`rounded-2xl p-4 sm:p-6 bg-gradient-to-br ${getPlayerColor(index)} shadow-lg border-2 border-white/20 ${
                  isHighScore ? 'ring-4 ring-yellow-400 ring-opacity-60 shadow-[0_0_20px_rgba(255,215,0,0.6)]' : ''
                } transition-all duration-300 hover:scale-105`}
              >
                {/* Player Name (Arabic) */}
                <div className="mb-3 text-center">
                  <div 
                    className="font-extrabold text-sm sm:text-base mb-2"
                    style={{
                      color: '#FFD166',
                      textShadow: '0 0 8px rgba(255, 160, 0, 0.6), 0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    {player.name}
                  </div>
                </div>
                
                {/* Score (Large number) */}
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">
                    {points}
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

