import React from 'react';
import { getPlayerRank } from '../utils/gameLogic';
import type { Player } from '../types';

interface MedalsTableNewThemeProps {
  players: Player[];
}

export const MedalsTableNewTheme: React.FC<MedalsTableNewThemeProps> = ({ players }) => {
  const ranks = getPlayerRank(players);
  const sortedPlayers = [...players].sort((a, b) => ranks[a.id] - ranks[b.id]);

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-purple-800/90 to-purple-900/90 backdrop-blur-sm rounded-[26px] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_2px_8px_rgba(255,255,255,0.05)]">
        <h3 
          className="text-xl sm:text-2xl font-bold text-white mb-6 text-left"
          style={{
            textShadow: '0 0 10px rgba(255,255,255,0.3)',
          }}
        >
          Medals
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-purple-600">
                <th className="text-left py-4 px-4 text-sm sm:text-base font-bold text-white">اللاعب</th>
                <th className="text-center py-4 px-4 text-sm sm:text-base font-bold text-white">
                  <span className="text-3xl sm:text-4xl">🥇</span>
                </th>
                <th className="text-center py-4 px-4 text-sm sm:text-base font-bold text-white">
                  <span className="text-3xl sm:text-4xl">🥈</span>
                </th>
                <th className="text-center py-4 px-4 text-sm sm:text-base font-bold text-white">
                  <span className="text-3xl sm:text-4xl">🥉</span>
                </th>
                <th className="text-center py-4 px-4 text-sm sm:text-base font-bold text-white">
                  <span className="text-3xl sm:text-4xl">🍅</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, index) => (
                <tr
                  key={player.id}
                  className={`border-b border-purple-700/50 hover:bg-purple-700/20 transition-colors ${
                    index % 2 === 0 ? '' : 'bg-white/4'
                  }`}
                  style={index % 2 === 1 ? { background: 'rgba(255,255,255,0.04)' } : {}}
                >
                  <td className="py-4 px-4 text-sm sm:text-base font-semibold text-white">
                    {player.name}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 font-bold text-base sm:text-lg shadow-md">
                      {player.goldMedals}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800 font-bold text-base sm:text-lg shadow-md">
                      {player.silverMedals}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 text-orange-900 font-bold text-base sm:text-lg shadow-md">
                      {player.bronzeMedals}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-red-300 to-red-500 text-red-900 font-bold text-base sm:text-lg shadow-md">
                      {player.tomatoes || 0}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

