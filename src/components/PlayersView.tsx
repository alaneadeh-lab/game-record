import React from 'react';
import { PlayerCard } from './PlayerCard';
import { SummaryRow } from './SummaryRow';
import { MedalsTable } from './MedalsTable';
import { GamesHistoryTable } from './GamesHistoryTable';
import { getPlayerRank } from '../utils/gameLogic';
import type { Player, GameEntry } from '../types';

interface PlayersViewProps {
  players: Player[];
  gameEntries?: GameEntry[];
}

export const PlayersView: React.FC<PlayersViewProps> = ({ 
  players, 
  gameEntries = [],
}) => {
  const ranks = getPlayerRank(players);
  const sortedPlayers = [...players].sort((a, b) => ranks[a.id] - ranks[b.id]);

  return (
    <div 
      className="flex-1 flex flex-col justify-between pt-10 sm:pt-12 px-2 sm:px-4 pb-4 relative z-10 min-h-0 gap-3"
    >
      {/* Player Cards */}
      <div className="grid grid-cols-4 gap-3 sm:gap-4 w-full mt-8 sm:mt-10 flex-shrink-0">
        {sortedPlayers.map((player) => (
          <PlayerCard 
            key={player.id}
            player={player} 
            rank={ranks[player.id]} 
          />
        ))}
      </div>

      {/* Points Row */}
      <div className="mt-8 flex-shrink-0">
        <SummaryRow players={sortedPlayers} type="points" title="منصة التتويج" />
      </div>

      {/* Fatts Row */}
      <div className="mt-6 flex-shrink-0">
        <SummaryRow players={sortedPlayers} type="fatts" title=" فت فت" />
      </div>

      {/* Medals Table */}
      <div className="mt-8 w-full bg-white rounded-2xl shadow-3d p-4 sm:p-6">
        <MedalsTable players={sortedPlayers} />
      </div>

      {/* Games History Table */}
      {gameEntries.length > 0 && (
        <div className="mt-6 w-full">
          <GamesHistoryTable gameEntries={gameEntries} players={sortedPlayers} />
        </div>
      )}
    </div>
  );
};
