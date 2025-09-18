import {LoadingSpinner} from '@/components';
import {HeadToHeadStatistics} from '.';
import MatchRow from '@/components/match/MatchRow';
import {Match, Nullish, Team} from '@/types';

interface TabWithHeadToHeadProps {
  headToHeadError: string | null;
  headToHeadLoading: boolean;
  headToHeadMatches: Match[];
  opponentTeam: Team | Nullish;
  ourClubTeamIds: string[];
}

export default function TabWithHeadToHead({
  headToHeadError,
  headToHeadLoading,
  headToHeadMatches,
  opponentTeam,
  ourClubTeamIds,
}: TabWithHeadToHeadProps) {
  return (
    <div className="p-4">
      {headToHeadError && (
        <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700 mb-4">
          <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">
            Chyba při načítání vzájemných zápasů: {headToHeadError || 'Neznámá chyba'}
          </p>
        </div>
      )}

      {headToHeadLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : headToHeadMatches.length > 0 ? (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Vzájemné zápasy s {opponentTeam?.name || 'soupeřem'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Posledních {headToHeadMatches.length} zápasů mezi našimi týmy
            </p>
          </div>

          {/* Head-to-head statistics */}
          <HeadToHeadStatistics
            matches={headToHeadMatches}
            ourClubTeamIds={ourClubTeamIds}
            opponentTeamName={opponentTeam?.name || 'Soupeř'}
          />

          {/* Match list */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Detailní přehled vzájemných zápasů:
            </p>
            {headToHeadMatches.map((match: any) => {
              return (
                <MatchRow key={match.id} match={match} redirectionLinks={false} showSeason={true} />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            Žádné vzájemné zápasy s {opponentTeam?.name || 'soupeřem'} nejsou k dispozici
          </p>
        </div>
      )}
    </div>
  );
}
