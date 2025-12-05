import React from 'react';
import PokerAnimation from './PokerAnimation';
import type { Player } from '../types';
import { calculateMedalPoints } from '../utils/gameLogic';

interface SummaryRowProps {
  players: Player[];
  type: 'points' | 'fatts';
  title: string;
}

export const SummaryRow: React.FC<SummaryRowProps> = ({ players, type, title }) => {
  const isPoints = type === 'points';
  
  // Find the fatt leader (only for fatts row)
  const maxFatt = !isPoints ? Math.max(...players.map(p => p.fatts)) : 0;
  
  const getGradient = () => {
    if (isPoints) {
      return 'from-yellow-400 via-yellow-500 to-yellow-600';
    }
    return 'from-red-400 via-orange-500 to-red-600';
  };

  const getTextColor = () => {
    if (isPoints) {
      return 'text-yellow-900';
    }
    return 'text-red-900';
  };

  return (
    <div className="card-3d rounded-2xl pt-2 pb-4 px-4 sm:pt-3 sm:pb-5 sm:px-6 bg-gradient-to-br from-white to-gray-50 shadow-3d">
      <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center ${getTextColor()}`}>
        {title}
      </h3>
      <div className="grid grid-cols-4 gap-3 sm:gap-4">
        {players.map((player) => {
          const value = isPoints ? calculateMedalPoints(player) : player.fatts;
          const isFattLeader = !isPoints && maxFatt > 0 && player.fatts === maxFatt;
          return (
            <div key={player.id} className="relative">
              <div
                className={`embossed rounded-2xl px-4 py-4 bg-gradient-to-br ${getGradient()} text-center transform transition-all duration-200 hover:scale-105 flex flex-col justify-center shadow-3d relative`}
              >
                <div className="text-xs sm:text-sm font-semibold text-white mb-1 sm:mb-2 opacity-90 truncate">
                  {player.name}
                </div>
                <div className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">
                  {value}
                </div>
              </div>
              {isFattLeader && (
                <PokerAnimation
                  size={64}
                  className="absolute -top-8 -right-4 z-50"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

