'use client';

import { Card, CardHeader, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Image } from '@heroui/react';
import { CategoryStandingsFallback } from './CategoryStandingsFallback';
import { LoadingSpinner } from '@/components';

interface CategoryStandingsProps {
  categoryId: string;
  categoryName: string;
  standings?: any[];
}

export function CategoryStandings({ categoryId, categoryName, standings = [] }: CategoryStandingsProps) {
  const loading = false;
  const error = null;



  // Helper function to check if suffixes are needed
  const checkIfSuffixesNeeded = (standings: any[]) => {
    const clubTeams = new Map<string, string[]>(); // club name -> array of team suffixes
    
    standings.forEach(standing => {
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
        shortDisplayName: shortDisplayName
      }
    };
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Tabulka</h3>
        </CardHeader>
        <CardBody>
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner />
          </div>
        </CardBody>
      </Card>
    );
  }

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

  if (processedStandings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Tabulka</h3>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8 text-gray-500">
            <p>Pro tuto kategorii zatím nejsou k dispozici žádná data v tabulce.</p>
          </div>
        </CardBody>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Tabulka</h3>
      </CardHeader>
      <CardBody>
        <Table aria-label="Standings table">
          <TableHeader>
            <TableColumn>Poz.</TableColumn>
            <TableColumn>Tým</TableColumn>
            <TableColumn className="hidden md:table-cell text-center">Z</TableColumn>
            <TableColumn className="hidden md:table-cell text-center">V</TableColumn>
            <TableColumn className="hidden md:table-cell text-center">R</TableColumn>
            <TableColumn className="hidden md:table-cell text-center">P</TableColumn>
            <TableColumn className="text-center">Skóre</TableColumn>
            <TableColumn className="text-center">Body</TableColumn>
          </TableHeader>
          <TableBody>
            {processedStandings.map((team) => {
              // console.log('Rendering team:', team);
              // console.log('Team.team:', team.team);
              return (
                <TableRow key={team.id}>
                  <TableCell className="font-medium text-center">{team.position}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Image 
                        src={team.team?.logo_url} 
                        alt={team.team?.name} 
                        width={20} 
                        height={20} 
                        className="hidden md:block"
                      />
                      
                      <span className="md:hidden">
                        {team.team?.shortDisplayName || team.team?.shortName || 'Neznámý tým'}
                      </span>
                      <span className="hidden md:inline">
                        {team.team?.displayName || team.team?.name || 'Neznámý tým'}
                      </span>
                    </div>
                  </TableCell>
                <TableCell className="text-center hidden md:table-cell">{team.matches}</TableCell>
                <TableCell className="text-center text-green-600 hidden md:table-cell">{team.wins}</TableCell>
                <TableCell className="text-center text-yellow-600 hidden md:table-cell">{team.draws}</TableCell>
                <TableCell className="text-center text-red-600 hidden md:table-cell">{team.losses}</TableCell>
                <TableCell className="text-center">
                  {team.goals_for}:{team.goals_against}
                </TableCell>
                <TableCell className="text-center font-bold text-blue-600">{team.points}</TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
