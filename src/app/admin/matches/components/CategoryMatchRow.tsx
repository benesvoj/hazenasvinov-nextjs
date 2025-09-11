import {Match} from '@/types';
import {Button} from '@heroui/button';
import {MapPinIcon} from '@heroicons/react/24/outline';
import {formatDateString} from '@/helpers';
import {formatTime} from '@/helpers/formatTime';
import {translations} from '@/lib/translations';
import {EyeIcon, PencilIcon, UserGroupIcon, TrashIcon} from '@heroicons/react/24/outline';

interface CategoryMatchRowProps {
  match: Match;
  onAddResult: (match: Match) => void;
  onEditMatch: (match: Match) => void;
  onLineupModalOpen: (match: Match) => void;
  onDeleteClick: (match: Match) => void;
  onMatchActionsOpen: (match: Match) => void;
  isSeasonClosed: boolean;
}

export const CategoryMatchRow = ({
  match,
  onAddResult,
  onEditMatch,
  onLineupModalOpen,
  onDeleteClick,
  onMatchActionsOpen,
  isSeasonClosed,
}: CategoryMatchRowProps) => {
  return (
    <div
      key={match.id}
      className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow lg:cursor-default cursor-pointer"
      onClick={(e) => {
        // Only handle click on mobile - prevent event bubbling
        e.stopPropagation();
        // Check if we're on mobile using CSS media query approach
        if (window.innerWidth < 1024) {
          onMatchActionsOpen(match);
        }
      }}
    >
      {/* Desktop: Grid layout */}
      <div className="hidden lg:grid grid-cols-11 gap-4 items-center">
        {/* Match Number - First Column */}
        <div className="col-span-1">
          {match.match_number ? (
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                #{match.match_number}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-sm text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">-</div>
            </div>
          )}
        </div>

        {/* Date and Time - Second Column */}
        <div className="col-span-2">
          <div className="text-start ">
            <div className="text-sm text-gray-600 mb-1">{formatDateString(match.date)}</div>
            <div className="text-lg font-semibold text-gray-800">{formatTime(match.time)}</div>
          </div>
        </div>

        {/* Teams and Venue - Third Column */}
        <div className="col-span-6">
          <div className="text-start">
            <div className="text-lg font-semibold text-gray-800 mb-2">
              {match.home_team?.display_name ||
                match.home_team?.name ||
                translations.team.unknownTeam}{' '}
              vs{' '}
              {match.away_team?.display_name ||
                match.away_team?.name ||
                translations.team.unknownTeam}
            </div>
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <MapPinIcon className="w-4 h-4 text-gray-400" />
              <span>{match.venue}</span>
            </div>
          </div>
        </div>

        {/* Score - Fourth Column */}
        <div className="col-span-2">
          <div className="text-center">
            {match.status === 'completed' ? (
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {match.home_score} : {match.away_score}
                </div>
                <div className="text-sm text-gray-500">
                  ({match.home_score_halftime} : {match.away_score_halftime})
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                Skóre zatím není k dispozici
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="lg:hidden space-y-3">
        {/* Match Number */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Číslo zápasu:</span>
          {match.match_number ? (
            <div className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              #{match.match_number}
            </div>
          ) : (
            <div className="text-sm text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">-</div>
          )}
        </div>

        {/* Date and Time */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Datum a čas:</span>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {new Date(match.date).toLocaleDateString('cs-CZ')}
            </div>
            <div className="text-lg font-semibold text-gray-800">{match.time}</div>
          </div>
        </div>

        {/* Teams */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Týmy:</span>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-800">
              {match.home_team?.display_name || match.home_team?.name || 'Neznámý tým'} vs{' '}
              {match.away_team?.display_name || match.away_team?.name || 'Neznámý tým'}
            </div>
          </div>
        </div>

        {/* Venue */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Místo:</span>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPinIcon className="w-4 h-4 text-gray-400" />
            <span>{match.venue}</span>
          </div>
        </div>

        {/* Score */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Skóre:</span>
          <div className="text-right">
            {match.status === 'completed' ? (
              <div className="text-xl font-bold text-gray-800">
                {match.home_score} : {match.away_score}
              </div>
            ) : (
              <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                Skóre zatím není k dispozici
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: Show all actions directly */}
      <div className="hidden lg:block mt-4 pt-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-2 justify-end">
          {match.status === 'upcoming' && (
            <Button
              size="sm"
              color="primary"
              variant="light"
              startContent={<EyeIcon className="w-4 h-4" />}
              onPress={() => onAddResult(match)}
              isDisabled={isSeasonClosed}
            >
              Výsledek
            </Button>
          )}
          <Button
            size="sm"
            color="primary"
            variant="light"
            startContent={<PencilIcon className="w-4 h-4" />}
            onPress={() => onEditMatch(match)}
            isDisabled={isSeasonClosed}
          >
            Upravit
          </Button>
          <Button
            size="sm"
            color="primary"
            variant="light"
            startContent={<UserGroupIcon className="w-4 h-4" />}
            onPress={() => onLineupModalOpen(match)}
            isDisabled={isSeasonClosed}
          >
            Sestavy
          </Button>
          <Button
            size="sm"
            color="danger"
            variant="light"
            startContent={<TrashIcon className="w-4 h-4" />}
            onPress={() => onDeleteClick(match)}
            isDisabled={isSeasonClosed}
          >
            Smazat
          </Button>
        </div>
      </div>

      {/* Mobile: Show action indicator */}
      <div className="lg:hidden mt-4 pt-3 border-t border-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <span>Klikněte pro akce</span>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
