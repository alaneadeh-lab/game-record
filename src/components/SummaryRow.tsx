import React, { useState, useEffect, Suspense, lazy } from 'react';
import Crown from './Crown';
import type { Player } from '../types';
import { calculateMedalPoints, getPlayerRank } from '../utils/gameLogic';

// Lazy load animation components to reduce initial bundle size
const PokerAnimation = lazy(() => import('./PokerAnimation'));
const TiredEmojiAnimation = lazy(() => import('./TiredEmojiAnimation'));
const FlySwarm = lazy(() => import('./FlySwarm'));

interface SummaryRowProps {
  players: Player[];
  type: 'points' | 'fatts';
  title: string;
  /** Win limit for this set (منصة التتويج only). */
  winScoreLimit?: number;
}

export const SummaryRow: React.FC<SummaryRowProps> = ({
  players,
  type,
  title,
  winScoreLimit,
}) => {
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
      return 'from-blue-500 via-blue-600 to-blue-700';
    }
    return 'from-purple-500 via-purple-600 to-purple-700';
  };

  return (
    <div className="card-3d rounded-2xl pt-2 pb-4 px-4 sm:pt-3 sm:pb-5 sm:px-6 bg-gradient-to-br from-white to-gray-50 shadow-3d relative">
      {isPoints && typeof winScoreLimit === 'number' && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
          حد الفوز: {winScoreLimit}
        </div>
      )}
      <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center text-gray-800 flex items-center justify-center gap-2">
        <span className="text-2xl sm:text-3xl">{isPoints ? '🥇' : '😂'}</span>
        <span 
          style={{
            textShadow: '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.6), 0 0 30px rgba(255,255,255,0.4), 2px 2px 4px rgba(0,0,0,0.3)',
            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.9))',
          }}
        >
          {title}
        </span>
        <span className="text-2xl sm:text-3xl">{isPoints ? '🥇' : '😂'}</span>
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
              
              {/* Fly Swarm for Last Place (Points row only) */}
              {isLastPlace && (
                <Suspense fallback={<div className="w-28 h-28" />}>
                  <FlySwarm
                    size={112}
                    className="absolute -top-8 -right-2 z-50 pointer-events-none"
                  />
                </Suspense>
              )}
              
              <div
                className={`embossed rounded-2xl px-4 py-4 bg-gradient-to-br ${getGradient()} text-center transform transition-all duration-200 hover:scale-105 flex flex-col justify-center shadow-3d relative`}
              >
                <div 
                  className={`font-semibold mb-1 sm:mb-2 truncate ${isPoints ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'}`}
                  style={{
                    color: '#ffffff',
                    textShadow: '2px 2px 0px rgba(0,0,0,0.8), 0px 0px 10px rgba(0,0,0,0.5), 0px 2px 4px rgba(0,0,0,0.6)',
                    WebkitTextStroke: '0.5px rgba(0,0,0,0.3)',
                  }}
                >
                  {player.name}
                </div>
                <div 
                  className="text-lg sm:text-xl font-bold"
                  style={{
                    color: '#ffffff',
                    textShadow: '3px 3px 0px rgba(0,0,0,0.9), 0px 0px 15px rgba(0,0,0,0.6), 0px 3px 6px rgba(0,0,0,0.7), 1px 1px 2px rgba(255,255,255,0.3)',
                    WebkitTextStroke: '1px rgba(0,0,0,0.4)',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
                  }}
                >
                  {value}
                </div>
              </div>
              {isFattLeader && (
                <Suspense fallback={<div className="w-16 h-16" />}>
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
                </Suspense>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

