'use client';

import Image from 'next/image';

import {Card, CardHeader, CardBody} from '@heroui/react';

import {TrophyIcon} from '@heroicons/react/24/outline';

import {LoadingSpinner, UnifiedStandingTable} from '@/components';
import {EnhancedStanding} from '@/types';
import {getTeamDisplayNameSafe, createClubTeamCountsMap} from '@/utils';

export default function CategoryStandingsTable({
  standings,
  standingsLoading,
}: {
  standings: EnhancedStanding[];
  standingsLoading: boolean;
}) {
  // Smart suffix logic: determine team counts per club in this category
  const clubTeamCounts = createClubTeamCountsMap(standings);
  return (
    <div>
      <Card>
        <CardHeader className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-yellow-600" />
            <div>
              <h3 className="text-xl font-semibold">Tabulka</h3>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {standingsLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-1 lg:px-2 text-xs lg:text-sm">Poz.</th>
                    <th className="text-left py-2 px-1 lg:px-2 text-xs lg:text-sm">Tým</th>
                    <th className="text-center py-2 px-1 lg:px-2 text-xs lg:text-sm">Z</th>
                    <th className="text-center py-2 px-1 lg:px-2 text-xs lg:text-sm">V</th>
                    <th className="text-center py-2 px-1 lg:px-2 text-xs lg:text-sm">R</th>
                    <th className="text-center py-2 px-1 lg:px-2 text-xs lg:text-sm">P</th>
                    <th className="text-center py-2 px-1 lg:px-2 text-xs lg:text-sm">Skóre</th>
                    <th className="text-center py-2 px-1 lg:px-2 text-xs lg:text-sm">Body</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((standing, index) => {
                    // Use the utility function for consistent team name logic
                    const teamName = (() => {
                      if (standing.club) {
                        // Smart suffix logic: only show suffix if club has multiple teams in this category
                        const teamCount = clubTeamCounts.get(standing.club.id) || 0;
                        return getTeamDisplayNameSafe(
                          standing.club.name,
                          standing.team?.team_suffix || 'A',
                          teamCount,
                          'N/A'
                        );
                      } else if (standing.team?.name) {
                        // Fallback to team name if club data is missing
                        return standing.team.name;
                      } else {
                        return 'N/A';
                      }
                    })();

                    const teamNameShort = (() => {
                      if (standing.club) {
                        // Smart suffix logic: only show suffix if club has multiple teams in this category
                        const teamCount = clubTeamCounts.get(standing.club.id) || 0;
                        return getTeamDisplayNameSafe(
                          standing.club.short_name,
                          standing.team?.team_suffix || 'A',
                          teamCount,
                          'N/A'
                        );
                      } else if (standing.team?.name) {
                        // Fallback to team name if club data is missing
                        return standing.team.name;
                      } else {
                        return 'N/A';
                      }
                    })();

                    // Check if this is our club - for now, we'll set it to false since the data structure may not include this field
                    const isOwnClub = false;
                    const teamLogo = standing.club?.logo_url || '';

                    return (
                      <tr
                        key={index}
                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          isOwnClub ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <td className="py-2 px-1 lg:px-2 font-semibold text-xs lg:text-sm">
                          {standing.position}.
                        </td>
                        <td className="py-2 px-1 lg:px-2 font-medium">
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
                            <span
                              className={`text-xs lg:text-base ${isOwnClub ? 'font-bold text-blue-700 dark:text-blue-300' : ''}`}
                            >
                              {/* Mobile: Short name, Desktop: Full name */}
                              <span className="lg:hidden">{teamNameShort}</span>
                              <span className="hidden lg:inline">{teamName}</span>
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-1 lg:px-2 text-center text-xs lg:text-sm">
                          {standing.matches}
                        </td>
                        <td className="py-2 px-1 lg:px-2 text-center text-green-600 text-xs lg:text-sm">
                          {standing.wins}
                        </td>
                        <td className="py-2 px-1 lg:px-2 text-center text-yellow-600 text-xs lg:text-sm">
                          {standing.draws}
                        </td>
                        <td className="py-2 px-1 lg:px-2 text-center text-red-600 text-xs lg:text-sm">
                          {standing.losses}
                        </td>
                        <td className="py-2 px-1 lg:px-2 text-center text-xs lg:text-sm">
                          {standing.goals_for}:{standing.goals_against}
                        </td>
                        <td
                          className={`py-2 px-1 lg:px-2 text-center font-bold text-xs lg:text-sm ${isOwnClub ? 'text-blue-700 dark:text-blue-300' : ''}`}
                        >
                          {standing.points}
                        </td>
                      </tr>
                    );
                  })}
                  {standings.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        <div className="mb-2">Žádná data pro tabulku</div>
                        <div className="text-sm text-gray-400">
                          Pro vybranou kategorii a sezónu nejsou k dispozici žádná data
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
      <UnifiedStandingTable standings={standings} loading={standingsLoading} />
    </div>
  );
}
