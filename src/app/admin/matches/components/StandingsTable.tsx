import React from "react";
import { Button } from "@heroui/button";
import { TrophyIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { EnhancedStanding } from "@/hooks/useStandings";
import { getTeamDisplayNameSafe, createClubTeamCountsMap } from "@/utils";

interface StandingsTableProps {
  standings: EnhancedStanding[];
  categoryId: string;
  categoryName: string;
  isSeasonClosed: boolean;
  onGenerateStandings: () => void;
  hasStandings: boolean;
}

export default function StandingsTable({
  standings,
  categoryId,
  categoryName,
  isSeasonClosed,
  onGenerateStandings,
  hasStandings,
}: StandingsTableProps) {
  const categoryStandings = standings.filter(
    (standing) => standing.category_id === categoryId
  );

  // Debug: Check if standings have team data
  const standingsWithTeams = categoryStandings.filter(
    (standing) => standing.team || standing.club
  );
  const standingsWithoutTeams = categoryStandings.filter(
    (standing) => !standing.team && !standing.club
  );

  // Smart suffix logic: determine team counts per club in this category
  const clubTeamCounts = createClubTeamCountsMap(categoryStandings);

  console.log("🔍 StandingsTable Debug:", {
    categoryId,
    categoryName,
    totalStandings: categoryStandings.length,
    standingsWithTeams: standingsWithTeams.length,
    standingsWithoutTeams: standingsWithoutTeams.length,
    clubTeamCounts: Object.fromEntries(clubTeamCounts),
    sampleStanding: categoryStandings[0],
  });

  // Debug: Show which teams will show suffixes
  categoryStandings.forEach((standing, index) => {
    if (standing.club) {
      const teamCount = clubTeamCounts.get(standing.club.id) || 0;
      const willShowSuffix = teamCount > 1;
      console.log(
        `🔍 Standing ${index}: ${standing.club.name} - Team count: ${teamCount}, Will show suffix: ${willShowSuffix}`
      );
    } else {
      console.log(`🔍 Standing ${index}: No club data - team:`, standing.team);
    }
  });

  if (!hasStandings) {
    return (
      <div className="mt-8">
        <h4 className="text-lg font-semibold mb-4">Tabulka - {categoryName}</h4>

        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-500 mb-4">
            <TrophyIcon className="w-12 h-12 mx-auto text-gray-400" />
          </div>
          <h5 className="text-lg font-medium text-gray-700 mb-2">
            Žádná tabulka
          </h5>
          <p className="text-gray-500 mb-4">
            Pro tuto kategorii ještě nebyla vygenerována tabulka.
          </p>
          <Button
            color="secondary"
            size="sm"
            onPress={onGenerateStandings}
            isDisabled={isSeasonClosed}
          >
            Generovat tabulku
          </Button>
        </div>
      </div>
    );
  }

  const tableHeaderClassLeft = 'px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
  const tableHeaderClassCenter = 'px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold">Tabulka - {categoryName}</h4>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className={tableHeaderClassLeft}>
                    Pozice
                  </th>
                  <th className={tableHeaderClassLeft}>
                    Tým
                  </th>
                  <th className={tableHeaderClassLeft}>
                    Z
                  </th>
                  <th className={tableHeaderClassLeft}>
                    V
                  </th>
                  <th className={tableHeaderClassLeft}>
                    R
                  </th>
                  <th className={tableHeaderClassCenter}>
                    P
                  </th>
                  <th className={tableHeaderClassCenter}>
                    Skóre
                  </th>
                  <th className={tableHeaderClassCenter}>
                    Body
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryStandings.map((standing, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {standing.position}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {(standing.club?.logo_url ||
                          standing.team?.logo_url) && (
                          <Image
                            src={
                              standing.club?.logo_url ||
                              standing.team?.logo_url ||
                              ""
                            }
                            alt={`${
                              standing.club?.name || standing.team?.name
                            } logo`}
                            width={24}
                            height={24}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <span className="text-sm text-gray-900">
                          {(() => {
                            if (standing.club) {
                              // Smart suffix logic: only show suffix if club has multiple teams in this category
                              const teamCount = clubTeamCounts.get(standing.club.id) || 0;
                              return getTeamDisplayNameSafe(
                                standing.club.name,
                                standing.team?.team_suffix || "A",
                                teamCount,
                                "N/A"
                              );
                            } else if (standing.team?.name) {
                              // Fallback to team name if club data is missing
                              return standing.team.name;
                            } else {
                              return "N/A";
                            }
                          })()}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {standing.matches}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {standing.wins}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {standing.draws}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {standing.losses}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {standing.goals_for}:{standing.goals_against}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">
                      {standing.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
