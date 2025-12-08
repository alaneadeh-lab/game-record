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
      <div 
        className="bg-gradient-to-br from-purple-600/80 to-purple-800/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_2px_8px_rgba(255,255,255,0.1)]"
        style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.25), 0 8px 32px rgba(0,0,0,0.3)' }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {sortedPlayers.map((player, index) => {
            const points = calculateMedalPoints(player);
            const isHighScore = index === 0; // First player has highest score
            
            return (
              <div
                key={player.id}
                className={`rounded-[24px] p-5 sm:p-7 bg-gradient-to-br ${getPlayerColor(index)} border-3 border-white/30 transition-all duration-300 hover:scale-105 ${
                  isHighScore ? 'shadow-[0_0_12px_rgba(255,215,0,0.7)]' : ''
                }`}
                style={{
                  borderWidth: '3px',
                  boxShadow: isHighScore 
                    ? '0 0 12px rgba(255,215,0,0.7), 0 4px 10px rgba(0,0,0,0.25)'
                    : '0 4px 10px rgba(0,0,0,0.25)',
                }}
              >
                {/* Player Name (Arabic) */}
                <div className="mb-4 text-center">
                  <div 
                    className="font-extrabold text-base sm:text-lg"
                    style={{
                      color: '#FFD166',
                      textShadow: '0 0 10px rgba(255, 160, 0, 0.8), 0 2px 4px rgba(0,0,0,0.4)',
                    }}
                  >
                    {player.name}
                  </div>
                </div>
                
                {/* Score (Large number) */}
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-black text-white drop-shadow-lg">
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

