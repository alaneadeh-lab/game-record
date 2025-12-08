import React from 'react';
import { getPlayerRank } from '../utils/gameLogic';
import type { Player } from '../types';

interface PodiumNewThemeProps {
  players: Player[];
}

export const PodiumNewTheme: React.FC<PodiumNewThemeProps> = ({ players }) => {
  const ranks = getPlayerRank(players);
  const sortedPlayers = [...players].sort((a, b) => ranks[a.id] - ranks[b.id]);

  // Get players by rank
  const firstPlace = sortedPlayers.find(p => ranks[p.id] === 1);
  const secondPlace = sortedPlayers.find(p => ranks[p.id] === 2);
  const thirdPlace = sortedPlayers.find(p => ranks[p.id] === 3);
  const fourthPlace = sortedPlayers.find(p => ranks[p.id] === 4);

  return (
    <div className="w-full">
      <div className="flex items-end justify-center gap-3 sm:gap-4 relative">
        {/* 2nd Place - Left */}
        {secondPlace && (
          <div className="flex-1 max-w-[140px] sm:max-w-[180px] flex flex-col items-center">
            {/* Silver Badge "2" */}
            <div className="mb-2 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-lg border-2 border-white">
              <span className="text-white font-bold text-xl sm:text-2xl">2</span>
            </div>
            
            {/* Silver Leaf Accent */}
            <div className="mb-2 text-2xl sm:text-3xl opacity-80">🍃</div>
            
            {/* Player Frame */}
            <div className="w-full aspect-[3/4] rounded-3xl overflow-hidden border-4 border-gray-300 shadow-[0_0_20px_rgba(200,200,200,0.6)] relative bg-gradient-to-br from-blue-400 to-blue-600">
              {secondPlace.photo ? (
                <img 
                  src={secondPlace.photo} 
                  alt={secondPlace.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white text-4xl sm:text-5xl font-bold">
                  {secondPlace.name.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Inner glow */}
              <div className="absolute inset-0 border-2 border-white/30 rounded-3xl pointer-events-none" />
            </div>
            
            {/* Name Label */}
            <div className="mt-3 text-center">
              <div 
                className="font-extrabold text-sm sm:text-base"
                style={{
                  color: '#FFD166',
                  textShadow: '0 0 8px rgba(255, 160, 0, 0.6), 0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                {secondPlace.name}
              </div>
            </div>
          </div>
        )}

        {/* 1st Place - Center (Biggest) */}
        {firstPlace && (
          <div className="flex-1 max-w-[200px] sm:max-w-[240px] flex flex-col items-center">
            {/* Gold Badge "1" */}
            <div className="mb-3 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg border-3 border-yellow-300">
              <span className="text-white font-bold text-2xl sm:text-3xl">1</span>
            </div>
            
            {/* Golden Leaves */}
            <div className="mb-2 flex gap-2">
              <span className="text-3xl sm:text-4xl opacity-90">🍃</span>
              <span className="text-3xl sm:text-4xl opacity-90">🍃</span>
            </div>
            
            {/* Player Frame - Largest */}
            <div className="w-full aspect-[3/4] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border-4 border-yellow-400 shadow-[0_0_30px_rgba(255,215,0,0.8)] relative bg-gradient-to-br from-yellow-300 to-yellow-500">
              {firstPlace.photo ? (
                <img 
                  src={firstPlace.photo} 
                  alt={firstPlace.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-300 to-yellow-500 text-white text-5xl sm:text-6xl font-bold">
                  {firstPlace.name.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Inner glow */}
              <div className="absolute inset-0 border-2 border-white/30 rounded-[2rem] sm:rounded-[2.5rem] pointer-events-none" />
            </div>
            
            {/* Name Label */}
            <div className="mt-4 text-center">
              <div 
                className="font-extrabold text-base sm:text-lg"
                style={{
                  color: '#FFD166',
                  textShadow: '0 0 8px rgba(255, 160, 0, 0.6), 0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                {firstPlace.name}
              </div>
            </div>
          </div>
        )}

        {/* 3rd Place - Right */}
        {thirdPlace && (
          <div className="flex-1 max-w-[140px] sm:max-w-[180px] flex flex-col items-center">
            {/* Bronze Badge "3" */}
            <div className="mb-2 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg border-2 border-white">
              <span className="text-white font-bold text-xl sm:text-2xl">3</span>
            </div>
            
            {/* Bronze Leaves */}
            <div className="mb-2 text-2xl sm:text-3xl opacity-80">🍃</div>
            
            {/* Player Frame */}
            <div className="w-full aspect-[3/4] rounded-3xl overflow-hidden border-4 border-orange-400 shadow-[0_0_20px_rgba(255,145,0,0.6)] relative bg-gradient-to-br from-orange-400 to-orange-600">
              {thirdPlace.photo ? (
                <img 
                  src={thirdPlace.photo} 
                  alt={thirdPlace.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 text-white text-4xl sm:text-5xl font-bold">
                  {thirdPlace.name.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Inner glow */}
              <div className="absolute inset-0 border-2 border-white/30 rounded-3xl pointer-events-none" />
            </div>
            
            {/* Name Label */}
            <div className="mt-3 text-center">
              <div 
                className="font-extrabold text-sm sm:text-base"
                style={{
                  color: '#FFD166',
                  textShadow: '0 0 8px rgba(255, 160, 0, 0.6), 0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                {thirdPlace.name}
              </div>
            </div>
          </div>
        )}

        {/* 4th Place - Far Right */}
        {fourthPlace && (
          <div className="flex-1 max-w-[140px] sm:max-w-[180px] flex flex-col items-center">
            {/* Tomato Badge */}
            <div className="mb-2 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg border-2 border-white">
              <span className="text-2xl sm:text-3xl">🍅</span>
            </div>
            
            {/* Fun accent */}
            <div className="mb-2 text-2xl sm:text-3xl opacity-80">🍃</div>
            
            {/* Player Frame */}
            <div className="w-full aspect-[3/4] rounded-3xl overflow-hidden border-4 border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.6)] relative bg-gradient-to-br from-green-400 to-green-600">
              {fourthPlace.photo ? (
                <img 
                  src={fourthPlace.photo} 
                  alt={fourthPlace.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 text-white text-4xl sm:text-5xl font-bold">
                  {fourthPlace.name.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Inner glow */}
              <div className="absolute inset-0 border-2 border-white/30 rounded-3xl pointer-events-none" />
            </div>
            
            {/* Name Label */}
            <div className="mt-3 text-center">
              <div 
                className="font-extrabold text-sm sm:text-base"
                style={{
                  color: '#FFD166',
                  textShadow: '0 0 8px rgba(255, 160, 0, 0.6), 0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                {fourthPlace.name}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

