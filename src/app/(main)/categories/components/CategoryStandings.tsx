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
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            team:team_id(id, name, short_name, logo_url, is_own_club)
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
          setStandings(standingsData || []);
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
          <h2 className="text-xl font-semibold">{translations.table.title}</h2>
        </CardHeader>
        <CardBody className="flex justify-center py-8">
          <Spinner size="lg" />
        </CardBody>
      </Card>
    );
  }

  if (error) {
    if (error === 'TABLE_NOT_FOUND') {
      return <CategoryStandingsFallback categoryName={categoryName} />;
    }
    
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">{translations.table.title}</h2>
        </CardHeader>
        <CardBody>
          <div className="text-center text-red-500 py-8">
            <p>Chyba při načítání tabulky: {error}</p>
            <p className="text-sm text-gray-500 mt-2">
              Tabulka může být prázdná nebo se načítá...
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (standings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">{translations.table.title}</h2>
        </CardHeader>
        <CardBody>
          <div className="text-center text-gray-500 py-8">
            <p>Pro tuto kategorii zatím nejsou k dispozici žádné výsledky.</p>
            <p className="text-sm mt-2">
              Tabulka se zobrazí po odehrání prvních zápasů.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">{translations.table.title}</h2>
      </CardHeader>
      <CardBody>
        <Table aria-label={`Tabulka pro kategorii ${categoryName}`}>
          <TableHeader>
            <TableColumn className="text-center">Pořadí</TableColumn>
            <TableColumn>Tým</TableColumn>
            <TableColumn className="hidden md:table-cell text-center">Z</TableColumn>
            <TableColumn className="hidden md:table-cell text-center">V</TableColumn>
            <TableColumn className="hidden md:table-cell text-center">R</TableColumn>
            <TableColumn className="hidden md:table-cell text-center">P</TableColumn>
            <TableColumn className="text-center">Skóre</TableColumn>
            <TableColumn className="text-center">Body</TableColumn>
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
                      {team.team?.short_name || team.team?.name || 'Neznámý tým'}
                    </span>
                    <span className="hidden md:inline">
                      {team.team?.name || 'Neznámý tým'}
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
