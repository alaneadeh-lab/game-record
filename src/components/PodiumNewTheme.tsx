import React from 'react';
import { getPlayerRank } from '../utils/gameLogic';
import CartoonImage from './CartoonImage';
import type { Player } from '../types';

const STAR_CAP = 10;

interface PodiumNewThemeProps {
  players: Player[];
  totalStarsByPlayerId?: Record<string, number>;
}

export const PodiumNewTheme: React.FC<PodiumNewThemeProps> = ({
  players,
  totalStarsByPlayerId = {},
}) => {
  const ranks = getPlayerRank(players);
  const sortedPlayers = [...players].sort((a, b) => ranks[a.id] - ranks[b.id]);

  // Get players by rank (only showing 1st, 2nd, and 4th - skipping 3rd)
  const firstPlace = sortedPlayers.find(p => ranks[p.id] === 1);
  const secondPlace = sortedPlayers.find(p => ranks[p.id] === 2);
  const fourthPlace = sortedPlayers.find(p => ranks[p.id] === 4);

  return (
    <div className="w-full">
      <div className="flex items-end justify-center gap-4 sm:gap-6 relative">
        {/* 2nd Place - Left */}
        {secondPlace && (
          <div className="flex-1 max-w-[140px] sm:max-w-[180px] flex flex-col items-center">
            {/* Light Blue Badge "2" */}
            <div 
              className="mb-3 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center border-2 border-white"
              style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.35))' }}
            >
              <span className="text-white font-bold text-xl sm:text-2xl">2</span>
            </div>
            
            {/* Player Frame with Golden Laurel Wreath Effect */}
            <div className="relative w-full aspect-square rounded-full overflow-hidden border-4 border-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.6)] bg-gradient-to-br from-blue-400 to-blue-600">
              {/* Golden laurel wreath decoration */}
              <div className="absolute -inset-2 z-10 pointer-events-none">
                <div className="w-full h-full rounded-full border-4 border-yellow-400/60" style={{
                  boxShadow: '0 0 15px rgba(255,215,0,0.4), inset 0 0 15px rgba(255,215,0,0.2)'
                }} />
              </div>
              {secondPlace.photo ? (
                <CartoonImage 
                  src={secondPlace.photo} 
                  alt={secondPlace.name}
                  className="w-full h-full object-cover relative z-0"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white text-4xl sm:text-5xl font-bold relative z-0">
                  {secondPlace.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="mt-3 text-center">
              <div
                className="font-extrabold text-base sm:text-lg"
                style={{
                  color: '#FFD700',
                  textShadow: '0 0 10px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.4)',
                }}
              >
                {secondPlace.name}
              </div>
              {(totalStarsByPlayerId[secondPlace.id] ?? 0) > 0 && (
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,215,0,0.9)' }}>
                  {(totalStarsByPlayerId[secondPlace.id] ?? 0) <= STAR_CAP
                    ? '⭐'.repeat(totalStarsByPlayerId[secondPlace.id] ?? 0)
                    : `⭐ ×${totalStarsByPlayerId[secondPlace.id]}`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 1st Place - Center (Biggest) */}
        {firstPlace && (
          <div className="flex-1 max-w-[200px] sm:max-w-[240px] flex flex-col items-center">
            {/* Gold Badge "1" */}
            <div 
              className="mb-3 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border-3 border-yellow-300"
              style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.35))' }}
            >
              <span className="text-white font-bold text-2xl sm:text-3xl">1</span>
            </div>
            
            {/* Player Frame - Largest with Golden Laurel Wreath */}
            <div className="relative w-full aspect-square rounded-full overflow-hidden border-4 border-yellow-400 shadow-[0_0_30px_rgba(255,215,0,0.8)] bg-gradient-to-br from-yellow-300 to-yellow-500">
              {/* Golden laurel wreath decoration */}
              <div className="absolute -inset-3 z-10 pointer-events-none">
                <div className="w-full h-full rounded-full border-4 border-yellow-400/70" style={{
                  boxShadow: '0 0 20px rgba(255,215,0,0.6), inset 0 0 20px rgba(255,215,0,0.3)'
                }} />
              </div>
              {firstPlace.photo ? (
                <CartoonImage 
                  src={firstPlace.photo} 
                  alt={firstPlace.name}
                  className="w-full h-full object-cover relative z-0"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-300 to-yellow-500 text-white text-5xl sm:text-6xl font-bold relative z-0">
                  {firstPlace.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="mt-4 text-center">
              <div
                className="font-extrabold text-lg sm:text-xl"
                style={{
                  color: '#FFD700',
                  textShadow: '0 0 10px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.4)',
                }}
              >
                {firstPlace.name}
              </div>
              {(totalStarsByPlayerId[firstPlace.id] ?? 0) > 0 && (
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,215,0,0.9)' }}>
                  {(totalStarsByPlayerId[firstPlace.id] ?? 0) <= STAR_CAP
                    ? '⭐'.repeat(totalStarsByPlayerId[firstPlace.id] ?? 0)
                    : `⭐ ×${totalStarsByPlayerId[firstPlace.id]}`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4th Place - Right (skip 3rd) */}
        {fourthPlace && (
          <div className="flex-1 max-w-[140px] sm:max-w-[180px] flex flex-col items-center">
            {/* Orange Badge "4" */}
            <div 
              className="mb-3 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center border-2 border-white"
              style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.35))' }}
            >
              <span className="text-white font-bold text-xl sm:text-2xl">4</span>
            </div>
            
            {/* Player Frame with Golden Laurel Wreath Effect */}
            <div className="relative w-full aspect-square rounded-full overflow-hidden border-4 border-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.6)] bg-gradient-to-br from-orange-400 to-orange-600">
              {/* Golden laurel wreath decoration */}
              <div className="absolute -inset-2 z-10 pointer-events-none">
                <div className="w-full h-full rounded-full border-4 border-yellow-400/60" style={{
                  boxShadow: '0 0 15px rgba(255,215,0,0.4), inset 0 0 15px rgba(255,215,0,0.2)'
                }} />
              </div>
              {fourthPlace.photo ? (
                <CartoonImage 
                  src={fourthPlace.photo} 
                  alt={fourthPlace.name}
                  className="w-full h-full object-cover relative z-0"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 text-white text-4xl sm:text-5xl font-bold relative z-0">
                  {fourthPlace.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="mt-3 text-center">
              <div
                className="font-extrabold text-base sm:text-lg"
                style={{
                  color: '#FFD700',
                  textShadow: '0 0 10px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.4)',
                }}
              >
                {fourthPlace.name}
              </div>
              {(totalStarsByPlayerId[fourthPlace.id] ?? 0) > 0 && (
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,215,0,0.9)' }}>
                  {(totalStarsByPlayerId[fourthPlace.id] ?? 0) <= STAR_CAP
                    ? '⭐'.repeat(totalStarsByPlayerId[fourthPlace.id] ?? 0)
                    : `⭐ ×${totalStarsByPlayerId[fourthPlace.id]}`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

