'use client';

import {Card, CardHeader, CardBody} from '@heroui/react';

import {UnifiedStandingTable} from '@/components';

import {CategoryStandingsFallback} from './CategoryStandingsFallback';

interface CategoryStandingsProps {
  categoryId: string;
  categoryName: string;
  standings?: any[];
}

export function CategoryStandings({
  categoryId,
  categoryName,
  standings = [],
}: CategoryStandingsProps) {
  const loading = false;
  const error = null;

  // Helper function to check if suffixes are needed
  const checkIfSuffixesNeeded = (standings: any[]) => {
    const clubTeams = new Map<string, string[]>(); // club name -> array of team suffixes

    standings.forEach((standing) => {
      const team = standing.team;
      if (team?.name && team.name !== 'Neznámý tým') {
        const parts = team.name.split(' ');
        if (parts.length > 1) {
          const suffix = parts[parts.length - 1]; // Last part is the suffix
          const clubName = parts.slice(0, -1).join(' '); // Everything except suffix

          if (!clubTeams.has(clubName)) {
            clubTeams.set(clubName, []);
          }
          clubTeams.get(clubName)!.push(suffix);
        }
      }
    });

    // Check if any club has multiple teams
    for (const [clubName, suffixes] of clubTeams) {
      if (suffixes.length > 1) {
        return true; // Need suffixes
      }
    }

    return false; // No suffixes needed
  };

  // Process standings to determine if suffixes are needed
  const needsSuffixes = checkIfSuffixesNeeded(standings);

  // Update team names based on suffix needs
  const processedStandings = standings.map((standing: any) => {
    const team = standing.team;
    if (!team?.name || team.name === 'Neznámý tým') return standing;

    let displayName = team.name;
    let shortDisplayName = team.shortName;

    if (needsSuffixes) {
      // Keep the full name with suffix
      displayName = team.name;
      shortDisplayName = team.shortName;
    } else {
      // Show only club name without suffix
      const clubName = team.name.split(' ').slice(0, -1).join(' ');
      const shortClubName = team.shortName.split(' ').slice(0, -1).join(' ');
      displayName = clubName || team.name;
      shortDisplayName = shortClubName || team.shortName;
    }

    return {
      ...standing,
      team: {
        ...team,
        displayName: displayName,
        shortDisplayName: shortDisplayName,
      },
    };
  });

  if (error === 'TABLE_NOT_FOUND') {
    return <CategoryStandingsFallback categoryName={categoryName} />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Tabulka</h3>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8 text-red-600">
            <p>Chyba při načítání tabulky: {error}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <UnifiedStandingTable
      emptyContent="Nejsou k dispozici žádná data."
      standings={processedStandings}
      loading={loading}
    />
  );
}
