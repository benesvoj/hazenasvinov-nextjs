import {useCallback} from 'react';

import {ImportTeamCandidate, resolveImportCategory, resolveImportTeam} from '@/helpers/matchImport';

import {CompetitionTypes} from '@/enums';
import {useSupabaseClient} from '@/hooks';

/** Row shape of the `teams` view — every column is nullable there. */
interface TeamViewRow {
  id: string | null;
  name: string | null;
  short_name: string | null;
  category_id: string | null;
  season_id: string | null;
}

interface ExcelMatch {
  date: string;
  time: string;
  matchNumber: string;
  homeTeam: string;
  awayTeam: string;
  category: string;
  status: 'valid' | 'invalid' | 'duplicate';
  errors?: string[];
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export const useExcelImport = () => {
  const supabase = useSupabaseClient();

  // Helper function to determine matchweek from date
  const determineMatchweek = (date: Date, seasonStartDate?: string): number => {
    if (!seasonStartDate) return 1; // Default to week 1 if no season start date

    try {
      const seasonStart = new Date(seasonStartDate);
      const timeDiff = date.getTime() - seasonStart.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const weekNumber = Math.ceil(daysDiff / 7);

      return Math.max(1, weekNumber); // Ensure week number is at least 1
    } catch (error) {
      console.warn('Could not determine matchweek from date, using default:', error);
      return 1;
    }
  };

  const importMatches = useCallback(
    async (matches: ExcelMatch[], seasonId: string): Promise<ImportResult> => {
      const result: ImportResult = {
        success: 0,
        failed: 0,
        errors: [],
      };

      // Get category and teams for mapping. Teams are scoped to the target
      // season — the view holds one row per team, category and season, so an
      // unscoped lookup can resolve to a previous season's team id.
      const {data: categories} = await supabase.from('categories').select('id, name');

      const {data: teams} = await supabase
        .from('teams')
        .select('id, name, short_name, category_id, season_id')
        .eq('season_id', seasonId);

      // Get season start date for matchweek calculation
      const {data: season} = await supabase
        .from('seasons')
        .select('start_date')
        .eq('id', seasonId)
        .single();

      if (!categories || !teams) {
        result.errors.push('Nepodařilo se načíst kategorie nebo týmy');
        return result;
      }

      // The view exposes every column as nullable — drop incomplete rows so the
      // shared resolver can work with plain strings.
      const teamCandidates: ImportTeamCandidate[] = (teams as TeamViewRow[]).flatMap((team) =>
        team.id && team.name
          ? [
              {
                id: team.id,
                name: team.name,
                short_name: team.short_name,
                category_id: team.category_id,
                season_id: team.season_id,
              },
            ]
          : []
      );

      // Process each match
      for (const match of matches) {
        try {
          // Find category ID
          const {match: category, error: categoryError} = resolveImportCategory(
            categories,
            match.category
          );

          if (!category) {
            result.failed++;
            result.errors.push(`${categoryError} pro zápas ${match.matchNumber}`);
            continue;
          }

          // Resolve teams within the row's category so a club playing several
          // categories cannot resolve to the wrong team id.
          const {match: homeTeam, error: homeTeamError} = resolveImportTeam(teamCandidates, {
            name: match.homeTeam,
            label: 'Domácí tým',
            categoryId: category.id,
            seasonId,
          });

          if (!homeTeam) {
            result.failed++;
            result.errors.push(`${homeTeamError} (zápas ${match.matchNumber})`);
            continue;
          }

          const {match: awayTeam, error: awayTeamError} = resolveImportTeam(teamCandidates, {
            name: match.awayTeam,
            label: 'Hostující tým',
            categoryId: category.id,
            seasonId,
          });

          if (!awayTeam) {
            result.failed++;
            result.errors.push(`${awayTeamError} (zápas ${match.matchNumber})`);
            continue;
          }

          // Parse date and time - handle European date format (DD.MM.YYYY)
          let dateObj: Date;
          if (match.date.includes('.')) {
            // European format: DD.MM.YYYY
            const [day, month, year] = match.date.split('.');
            // Create date string in YYYY-MM-DD format to avoid timezone issues
            const dateString = `${parseInt(year)}-${String(parseInt(month)).padStart(2, '0')}-${String(parseInt(day)).padStart(2, '0')}`;
            dateObj = new Date(dateString + 'T00:00:00');
          } else {
            // Standard format
            dateObj = new Date(match.date);
          }

          if (isNaN(dateObj.getTime())) {
            result.failed++;
            result.errors.push(`Neplatné datum "${match.date}" pro zápas ${match.matchNumber}`);
            continue;
          }

          // Format date for database (YYYY-MM-DD) - avoid timezone conversion
          const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

          // Validate time format
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(match.time)) {
            result.failed++;
            result.errors.push(`Neplatný čas "${match.time}" pro zápas ${match.matchNumber}`);
            continue;
          }

          // Check for duplicate matches
          const {data: existingMatch} = await supabase
            .from('matches')
            .select('id')
            .eq('category_id', category.id)
            .eq('season_id', seasonId)
            .eq('home_team_id', homeTeam.id)
            .eq('away_team_id', awayTeam.id)
            .eq('date', formattedDate)
            .eq('time', match.time)
            .single();

          if (existingMatch) {
            result.failed++;
            result.errors.push(
              `Duplicitní zápas: ${match.homeTeam} vs ${match.awayTeam} dne ${formattedDate} v ${match.time}`
            );
            continue;
          }

          // Determine matchweek from date
          const matchweek = determineMatchweek(dateObj, season?.start_date);

          // Insert match with both matchweek and match_number
          const {error: insertError} = await supabase.from('matches').insert({
            category_id: category.id,
            season_id: seasonId,
            date: formattedDate,
            time: match.time,
            home_team_id: homeTeam.id,
            away_team_id: awayTeam.id,
            venue: '', // Default empty venue
            competition: CompetitionTypes.LEAGUE, // Default competition type
            is_home: false, // Default value
            status: 'upcoming', // Default status
            matchweek: matchweek, // Calculated from date
            match_number: match.matchNumber, // Direct from Excel
          });

          if (insertError) {
            result.failed++;
            result.errors.push(
              `Chyba při ukládání zápasu ${match.matchNumber}: ${insertError.message}`
            );
            continue;
          }

          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push(
            `Neočekávaná chyba pro zápas ${match.matchNumber}: ${error instanceof Error ? error.message : 'Neznámá chyba'}`
          );
        }
      }

      return result;
    },
    [supabase]
  );

  return {
    importMatches,
  };
};
