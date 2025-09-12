import {Match} from '@/types/match';
import {matchStatusesKeys} from '@/constants/match';

interface MatchScoreProps {
  match: Match;
  desktopSize?: 'sm' | 'lg' | 'xl' | '2xl';
  mobileSize?: 'sm' | 'lg' | 'xl' | '2xl';
  halftimeSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
}

export default function MatchScore({
  match,
  desktopSize = 'lg',
  mobileSize = 'lg',
  halftimeSize = 'sm',
}: MatchScoreProps) {
  const scoreClass = `text-${mobileSize} lg:text-${desktopSize} font-bold text-gray-900 dark:text-white`;
  const scoreHalftimeClass = `text-${halftimeSize} text-gray-900 dark:text-white`;

  return (
    <>
      {match.status === matchStatusesKeys[1] ? (
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <span className={scoreClass}>
              {match.home_score !== undefined ? match.home_score : '-'}
            </span>
            <span className="text-gray-400 text-sm lg:text-base">:</span>
            <span className={scoreClass}>
              {match.away_score !== undefined ? match.away_score : '-'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className={scoreHalftimeClass}>
              {match.home_score_halftime !== null ? `( ${match.home_score_halftime}` : '( -'}
            </span>
            <span className="text-gray-400 text-sm">:</span>
            <span className={scoreHalftimeClass}>
              {match.away_score_halftime !== null ? `${match.away_score_halftime} )` : '- )'}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1 lg:gap-2">
          <span className="text-lg lg:text-2xl font-bold text-gray-400">-:-</span>
        </div>
      )}
    </>
  );
}
