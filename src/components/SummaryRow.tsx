import React, { useState, useEffect } from 'react';
import PokerAnimation from './PokerAnimation';
import TiredEmojiAnimation from './TiredEmojiAnimation';
import Crown from './Crown';
import SingleFly from './SingleFly';
import type { Player } from '../types';
import { calculateMedalPoints, getPlayerRank } from '../utils/gameLogic';

interface SummaryRowProps {
  players: Player[];
  type: 'points' | 'fatts';
  title: string;
}

export const SummaryRow: React.FC<SummaryRowProps> = ({ players, type, title }) => {
  const isPoints = type === 'points';
  
  // Find the fatt leader (only for fatts row)
  const maxFatt = !isPoints ? Math.max(...players.map(p => p.fatts)) : 0;
  
  // Get player ranks (only needed for points row to show crown/fly animations)
  const ranks = isPoints ? getPlayerRank(players) : {};
  
  // Alternate between poker animation and tired emoji for fatt leader
  // Poker animation: 4 seconds, Tired emoji: 1.5 seconds
  const [showPokerAnimation, setShowPokerAnimation] = useState(true);
  
  useEffect(() => {
    if (isPoints) return; // Only alternate for fatts row
    
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const scheduleNext = () => {
      if (showPokerAnimation) {
        // Show poker animation for 4 seconds
        timeoutId = setTimeout(() => {
          setShowPokerAnimation(false);
          scheduleNext();
        }, 4000);
      } else {
        // Show tired emoji for 1.5 seconds
        timeoutId = setTimeout(() => {
          setShowPokerAnimation(true);
          scheduleNext();
        }, 1500);
      }
    };
    
    scheduleNext();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isPoints, showPokerAnimation]);
  
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
          const playerRank = isPoints ? ranks[player.id] : 0;
          const isFirstPlace = isPoints && playerRank === 1;
          const isLastPlace = isPoints && playerRank === 4;
          
          return (
            <div key={player.id} className="relative">
              {/* Crown for 1st place (Points row only) */}
              {isFirstPlace && (
                <Crown
                  size={60}
                  className="absolute -top-8 -right-2 z-50 pointer-events-none animate-[float_2.4s_ease-in-out_infinite] drop-shadow-[0_0_12px_rgba(255,215,0,0.9)]"
                />
              )}
              
              {/* Single Fly for Last Place (Points row only) */}
              {isLastPlace && (
                <div className="absolute -top-8 -right-2 z-50 pointer-events-none w-[80px] h-[80px]">
                  <SingleFly
                    size={32}
                    className=""
                  />
                </div>
              )}
              
              <div
                className={`embossed rounded-2xl px-4 py-4 bg-gradient-to-br ${getGradient()} text-center transform transition-all duration-200 hover:scale-105 flex flex-col justify-center shadow-3d relative`}
              >
                <div className={`font-semibold text-white mb-1 sm:mb-2 opacity-90 truncate ${isPoints ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'}`}>
                  {player.name}
                </div>
                <div className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">
                  {value}
                </div>
              </div>
              {isFattLeader && (
                <>
                  {showPokerAnimation ? (
                    <PokerAnimation
                      size={64}
                      className="absolute -top-8 -right-4 z-50"
                    />
                  ) : (
                    <TiredEmojiAnimation
                      size={64}
                      className="absolute -top-8 -right-4 z-50"
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

