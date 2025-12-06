import React from 'react';
import FirstPlaceBadge from './FirstPlaceBadge';
import type { Player } from '../types';

interface PlayerCardProps {
  player: Player;
  rank: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, rank }) => {
  const getRankStyles = () => {
    switch (rank) {
      case 1:
        return {
          border: 'border-[6px] border-yellow-400',
          shadow: 'shadow-[0_0_15px_rgba(255,215,0,0.8)]',
          innerShadow: 'shadow-[inset_0_0_8px_rgba(255,215,0,0.3)]',
        };
      case 2:
        return {
          border: 'border-[6px] border-gray-300',
          shadow: 'shadow-[0_0_15px_rgba(200,200,200,0.8)]',
          innerShadow: 'shadow-[inset_0_0_8px_rgba(200,200,200,0.3)]',
        };
      case 3:
        return {
          border: 'border-[6px] border-orange-700',
          shadow: 'shadow-[0_0_15px_rgba(255,145,0,0.6)]',
          innerShadow: 'shadow-[inset_0_0_8px_rgba(255,145,0,0.3)]',
        };
      case 4:
        return {
          border: 'border-[6px] border-gray-600',
          shadow: 'shadow-[0_0_10px_rgba(0,0,0,0.4)]',
          innerShadow: 'shadow-[inset_0_0_8px_rgba(0,0,0,0.2)]',
        };
      default:
        return {
          border: 'border-2 border-gray-300',
          shadow: 'shadow-md',
          innerShadow: '',
        };
    }
  };

  const rankStyles = getRankStyles();

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* First Place Badge - Above the profile box */}
      {rank === 1 && (
        <FirstPlaceBadge
          size={80}
          className="absolute -top-10 z-50 pointer-events-none"
        />
      )}
      
      {/* Spacer to push card box down while keeping badge in place */}
      <div className="h-6 sm:h-8 w-full" />
      
      {/* Player Card Frame */}
      <div
        className={`w-full h-[140px] sm:h-[160px] rounded-2xl relative ${rankStyles.border} ${rankStyles.shadow} ${rankStyles.innerShadow}`}
        style={{
          boxShadow: rank === 1 
            ? '0 0 15px rgba(255, 215, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 0 8px rgba(255, 215, 0, 0.3)'
            : rank === 2
            ? '0 0 15px rgba(200, 200, 200, 0.8), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 0 8px rgba(200, 200, 200, 0.3)'
            : rank === 3
            ? '0 0 15px rgba(255, 145, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 0 8px rgba(255, 145, 0, 0.3)'
            : '0 0 10px rgba(0, 0, 0, 0.4), 0 4px 10px rgba(0, 0, 0, 0.2), inset 0 0 8px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Full-cover photo or gradient background */}
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          {player.photo ? (
            <img
              src={player.photo}
              alt={player.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-500 text-white text-4xl font-bold">
              {player.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Inner bevel effect */}
        <div className="absolute inset-0 rounded-xl border border-white/20 pointer-events-none z-10" />
      </div>

      {/* Player Name - Below Card */}
      <div className="mt-2 text-white text-base font-semibold text-center">
        {player.name}
      </div>
    </div>
  );
};
