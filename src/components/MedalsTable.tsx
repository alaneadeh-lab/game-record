import React from 'react';
import type { Player } from '../types';

interface MedalsTableProps {
  players: Player[];
}

export const MedalsTable: React.FC<MedalsTableProps> = ({ players }) => {
  const calculateTotalMedals = (player: Player) => {
    return player.goldMedals + player.silverMedals + player.bronzeMedals;
  };

  return (
    <div className="w-full max-w-full mx-auto">
      <div className="mb-3 sm:mb-4 text-center">
        <h3 className="text-base sm:text-lg font-bold text-gray-800 max-[500px]:text-sm">Medals</h3>
        <p className="text-xs sm:text-sm text-gray-600 hidden sm:block max-[500px]:text-xs">
          Total medals earned
        </p>
      </div>

      <div className="overflow-auto w-full">
        <table className="w-full max-w-full">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base font-bold text-gray-700 min-w-[80px] max-[500px]:text-xs max-[500px]:px-2">Player</th>
              <th className="text-center py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base font-bold text-gray-700 min-w-[60px] max-[500px]:text-xs max-[500px]:px-2">
                <span className="text-lg sm:text-xl max-[500px]:text-base">🥇</span>
              </th>
              <th className="text-center py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base font-bold text-gray-700 min-w-[60px] max-[500px]:text-xs max-[500px]:px-2">
                <span className="text-lg sm:text-xl max-[500px]:text-base">🥈</span>
              </th>
              <th className="text-center py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base font-bold text-gray-700 min-w-[60px] max-[500px]:text-xs max-[500px]:px-2">
                <span className="text-lg sm:text-xl max-[500px]:text-base">🥉</span>
              </th>
              <th className="text-center py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base font-bold text-gray-700 min-w-[60px] max-[500px]:text-xs max-[500px]:px-2">Tot</th>
              <th className="text-center py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base font-bold text-gray-700 hidden sm:table-cell min-w-[60px] max-[500px]:text-xs max-[500px]:px-2">Fatts</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr
                key={player.id}
                className="border-b-2 border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-colors duration-200"
              >
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-semibold text-gray-800 min-w-[80px] max-[500px]:text-xs max-[500px]:px-2">{player.name}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-center min-w-[60px] max-[500px]:px-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 font-bold text-sm sm:text-base shadow-md max-[500px]:w-6 max-[500px]:h-6 max-[500px]:text-xs">
                    {player.goldMedals}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-center min-w-[60px] max-[500px]:px-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800 font-bold text-sm sm:text-base shadow-md max-[500px]:w-6 max-[500px]:h-6 max-[500px]:text-xs">
                    {player.silverMedals}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-center min-w-[60px] max-[500px]:px-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 text-orange-900 font-bold text-sm sm:text-base shadow-md max-[500px]:w-6 max-[500px]:h-6 max-[500px]:text-xs">
                    {player.bronzeMedals}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-center font-bold text-base sm:text-lg text-gray-700 min-w-[60px] max-[500px]:text-sm max-[500px]:px-2">
                  {calculateTotalMedals(player)}
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-center font-bold text-sm sm:text-base text-red-600 hidden sm:table-cell min-w-[60px] max-[500px]:text-xs max-[500px]:px-2">
                  {player.fatts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
