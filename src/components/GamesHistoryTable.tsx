import React from 'react';
import type { GameEntry, Player } from '../types';

interface GamesHistoryTableProps {
  gameEntries: GameEntry[];
  players: Player[];
}

export const GamesHistoryTable: React.FC<GamesHistoryTableProps> = ({ gameEntries, players }) => {
  // Sort games by date (newest first)
  const sortedGames = [...gameEntries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );


  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (sortedGames.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl shadow-3d p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 text-center">Game History</h3>
        <p className="text-center text-gray-500 text-sm">No games recorded yet</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow-3d p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 text-center">Game History</h3>
      <div className="overflow-auto w-full">
        <table className="w-full">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base font-bold text-gray-700 max-[500px]:text-xs max-[500px]:px-2">Date</th>
              {players.map((player) => (
                <th 
                  key={player.id} 
                  className="text-center py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base font-bold text-gray-700 min-w-[80px] max-[500px]:text-xs max-[500px]:px-2"
                >
                  {player.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedGames.map((game) => (
              <tr
                key={game.id}
                className="border-b border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-colors duration-200"
              >
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-600 max-[500px]:text-xs max-[500px]:px-2">
                  {formatDate(game.date)}
                </td>
                {players.map((player) => {
                  const playerScore = game.playerScores.find(ps => ps.playerId === player.id);
                  const score = playerScore?.score ?? '-';
                  return (
                    <td 
                      key={player.id}
                      className="px-3 sm:px-4 py-2 sm:py-3 text-center text-sm sm:text-base font-semibold text-gray-800 max-[500px]:text-xs max-[500px]:px-2"
                    >
                      {score}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

