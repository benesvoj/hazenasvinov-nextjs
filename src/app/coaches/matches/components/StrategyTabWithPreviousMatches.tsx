import {LoadingSpinner} from '@/components';
import {OpponentMatchStatistics} from '.';
import {Match, Team, Nullish} from '@/types';
import MatchRow from '@/components/match/MatchRow';

interface TabWithPreviousMatchesProps {
  previousMatchesError: string | null;
  previousMatchesLoading: boolean;
  previousMatches: Match[];
  opponentTeam: Team | Nullish;
}
export default function StrategyTabWithPreviousMatches({
  previousMatchesError,
  previousMatchesLoading,
  previousMatches,
  opponentTeam,
}: TabWithPreviousMatchesProps) {
  return (
    <div className="p-4">
      {previousMatchesError && (
        <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700 mb-4">
          <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">
            Chyba při načítání předchozích zápasů: {previousMatchesError || 'Neznámá chyba'}
          </p>
        </div>
      )}

      {previousMatchesLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : previousMatches.length > 0 ? (
        <div className="space-y-6">
          {/* Statistics */}
          <OpponentMatchStatistics
            matches={previousMatches}
            opponentTeamName={opponentTeam?.name || 'Soupeř'}
          />

          {/* Match List */}
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Posledních {previousMatches.length} zápasů týmu {opponentTeam?.name || 'soupeře'}:
            </p>
            {previousMatches.map((match: any) => (
              <MatchRow key={match.id} match={match} redirectionLinks={false} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            Žádné předchozí zápasy týmu {opponentTeam?.name || 'soupeře'} nejsou k dispozici
          </p>
        </div>
      )}
    </div>
  );
}
