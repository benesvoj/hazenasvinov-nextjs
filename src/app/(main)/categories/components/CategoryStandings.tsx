'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardHeader, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Image } from '@heroui/react';
import { CategoryStandingsFallback } from './CategoryStandingsFallback';
import { translations } from '@/lib/translations';
import { Standing } from '@/types/types';

interface CategoryStandingsProps {
  categoryId: string;
  categoryName: string;
}

export function CategoryStandings({ categoryId, categoryName }: CategoryStandingsProps) {
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        
        // Get the active season
        const { data: seasonData, error: seasonError } = await supabase
          .from('seasons')
          .select('id')
          .eq('is_active', true)
          .single();
        
        if (seasonError) throw seasonError;
        
        // Fetch standings for this category and season with team information
        const { data: standingsData, error: standingsError } = await supabase
          .from('standings')
          .select(`
            id,
            team_id,
            matches,
            wins,
            draws,
            losses,
            goals_for,
            goals_against,
            points,
            position,
            team:team_id(
              id,
              team_suffix,
              club_category:club_categories(
                club:clubs(id, name, short_name, logo_url, is_own_club)
              )
            )
          `)
          .eq('category_id', categoryId)
          .eq('season_id', seasonData.id)
          .order('position', { ascending: true });
        
        if (standingsError) {
          // Check if it's a table not found error
          if (standingsError.code === '42P01') {
            setError('TABLE_NOT_FOUND');
          } else {
            console.error('Standings error:', standingsError);
            throw standingsError;
          }
        } else {
          // Transform standings to include team names and club information
          const transformedStandings = (standingsData || []).map((standing: any) => {
            const team = standing.team;
            
            // Create team name from club + suffix
            const teamName = team?.club_category?.club 
              ? `${team.club_category.club.name} ${team.team_suffix}`
              : 'Neznámý tým';
            
            return {
              ...standing,
              team: {
                id: team?.id,
                name: teamName,
                logo_url: team?.club_category?.club?.logo_url
              }
            };
          });
          
          // Check if we need to show suffixes (multiple teams from same club in same category)
          const needsSuffixes = checkIfSuffixesNeeded(transformedStandings);
          
          // Update team names based on suffix needs
          const finalStandings = transformedStandings.map((standing: any) => {
            const team = standing.team;
            if (!team?.name || team.name === 'Neznámý tým') return standing;
            
            let displayName = team.name;
            
            if (needsSuffixes) {
              // Keep the full name with suffix
              displayName = team.name;
            } else {
              // Show only club name without suffix
              const clubName = team.name.split(' ').slice(0, -1).join(' ');
              displayName = clubName || team.name;
            }
            
            return {
              ...standing,
              team: {
                ...team,
                displayName: displayName
              }
            };
          });
          
          setStandings(finalStandings);
        }
        
      } catch (err) {
        console.error('Failed to fetch standings:', err);
        setError(err instanceof Error ? err.message : 'Nepodařilo se načíst tabulku');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStandings();
  }, [categoryId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Tabulka</h3>
        </CardHeader>
        <CardBody>
          <div className="flex justify-center items-center py-8">
            <Spinner size="lg" />
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

  if (standings.length === 0) {
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
            <TableColumn className="hidden md:table-cell">Z</TableColumn>
            <TableColumn className="hidden md:table-cell">V</TableColumn>
            <TableColumn className="hidden md:table-cell">R</TableColumn>
            <TableColumn className="hidden md:table-cell">P</TableColumn>
            <TableColumn>Skóre</TableColumn>
            <TableColumn>Body</TableColumn>
          </TableHeader>
          <TableBody>
            {standings.map((team) => (
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
                      {team.team?.displayName || team.team?.name || 'Neznámý tým'}
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
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
