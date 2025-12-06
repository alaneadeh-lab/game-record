import React, { useState, useEffect } from 'react';
import PokerAnimation from './PokerAnimation';
import TiredEmojiAnimation from './TiredEmojiAnimation';
import Crown from './Crown';
import FlySwarm from './FlySwarm';
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
      // Rich red/crimson inspired by hearts/diamonds in playing cards
      return 'from-red-700 via-red-800 to-red-900';
    }
    // Dark navy/black inspired by spades/clubs in playing cards
    return 'from-slate-900 via-slate-800 to-black';
  };

  return (
    <div className="card-3d rounded-2xl pt-2 pb-4 px-4 sm:pt-3 sm:pb-5 sm:px-6 bg-gradient-to-br from-white to-gray-50 shadow-3d">
      <h3 
        className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center text-gray-800"
        style={{
          textShadow: '2px 2px 4px rgba(0,0,0,0.3), 0px 1px 2px rgba(255,255,255,0.8)',
        }}
      >
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
              
              {/* Fly Swarm for Last Place (Points row only) */}
              {isLastPlace && (
                <FlySwarm
                  size={112}
                  className="absolute -top-8 -right-2 z-50 pointer-events-none"
                />
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

