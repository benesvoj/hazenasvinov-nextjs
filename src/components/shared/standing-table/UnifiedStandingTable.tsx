import Image from 'next/image';

import {TrophyIcon} from '@heroicons/react/24/outline';

import {createClubTeamCountsMap, getTeamDisplayNameSafe} from '@/utils/teamDisplay';

import {Heading, UnifiedTable} from '@/components';
import {translations} from '@/lib';
import {EnhancedStanding, UnifiedStandingsTable, ColumnType} from '@/types';

const t = translations.components.unifiedStandingTable;

// Mobile-optimized columns: Only show Position, Team, Score, Points on mobile
// Desktop shows all columns
const columns = [
  {key: 'position', label: t.position, align: 'end'},
  {key: 'team', label: t.team},
  {key: 'matches', label: t.matches, align: 'center', className: 'hidden md:table-cell'},
  {key: 'wins', label: t.wins, align: 'center', className: 'hidden md:table-cell'},
  {key: 'draws', label: t.draws, align: 'center', className: 'hidden md:table-cell'},
  {key: 'losses', label: t.losses, align: 'center', className: 'hidden md:table-cell'},
  {key: 'score', label: t.score, align: 'center'},
  {key: 'points', label: t.points, align: 'end'},
];

const renderTeamCell = (item: EnhancedStanding, standings: EnhancedStanding[]) => {
  const clubTeamCounts = createClubTeamCountsMap(standings);

  const teamName = (() => {
    if (item.club) {
      // Smart suffix logic: only show suffix if club has multiple teams in this category
      const teamCount = clubTeamCounts.get(item.club.id) || 0;
      return getTeamDisplayNameSafe(
        item.club.name,
        item.team?.team_suffix || 'A',
        teamCount,
        'N/A'
      );
    } else if (item.team?.name) {
      // Fallback to team name if club data is missing
      return item.team.name;
    } else {
      return 'N/A';
    }
  })();

  const teamNameShort = (() => {
    if (item.club) {
      // Smart suffix logic: only show suffix if club has multiple teams in this category
      const teamCount = clubTeamCounts.get(item.club.id) || 0;
      return getTeamDisplayNameSafe(
        item.club.short_name,
        item.team?.team_suffix || 'A',
        teamCount,
        'N/A'
      );
    } else if (item.team?.name) {
      // Fallback to team name if club data is missing
      return item.team.name;
    } else {
      return 'N/A';
    }
  })();

  const teamLogo = item.club?.logo_url || '';

  return (
    <div className="flex items-center gap-1 lg:gap-2">
      {/* Logo - Hidden on mobile */}
      {teamLogo && (
        <div className="hidden lg:block">
          <Image
            src={teamLogo}
            alt={`${teamName} logo`}
            width={24}
            height={24}
            className="w-6 h-6 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      <span className="text-sm">
        {/* Mobile: Short name, Desktop: Full name */}
        <span className="lg:hidden">{teamNameShort}</span>
        <span className="hidden lg:inline">{teamName}</span>
      </span>
    </div>
  );
};

const renderCell = (
  item: EnhancedStanding,
  columnKey: string,
  standings: EnhancedStanding[]
): React.ReactNode => {
  switch (columnKey) {
    case 'team':
      return renderTeamCell(item, standings);
    case 'score':
      return `${item.goals_for}:${item.goals_against}`;
    case 'position':
      return item.position;
    case 'matches':
      return item.matches;
    case 'wins':
      return item.wins;
    case 'draws':
      return item.draws;
    case 'losses':
      return item.losses;
    case 'points':
      return item.points;
    default:
      return '-';
  }
};

export default function UnifiedStandingTable({
  standings,
  loading,
  categoryId,
  categoryName,
  showGenerateButton,
  onGenerateStandings,
  isSeasonClosed,
  ownClubId,
  responsive,
  emptyContent,
}: UnifiedStandingsTable) {
  const topContent = (
    <div className="flex items-center gap-2">
      <TrophyIcon className="w-5 h-5 text-yellow-600" />
      <div>
        <Heading size={3}>{t.title}</Heading>
      </div>
    </div>
  );

  const getCellColor = (item: EnhancedStanding, columnKey: string) => {
    switch (columnKey) {
      case 'wins':
        return 'green-600';
      case 'draws':
        return 'yellow-600';
      case 'losses':
        return 'red-600';
      default:
        return '';
    }
  };

  return (
    <UnifiedTable
      isLoading={loading}
      columns={columns as ColumnType<EnhancedStanding>[]}
      data={standings}
      renderCell={(item, columnKey) => renderCell(item, columnKey, standings)}
      ariaLabel="Standings Table"
      topContent={topContent}
      getCellColor={getCellColor}
      emptyContent={emptyContent}
    />
  );
}
