import {useCallback} from 'react';

import {
  ImportTeamCandidate,
  parseImportMatchweek,
  resolveImportCategory,
  resolveImportTeam,
} from '@/helpers/matchImport';

import {CompetitionTypes} from '@/enums';
import {useSupabaseClient} from '@/hooks';

interface ClubCategoryTeamRow {
  id: string;
  team_suffix: string;
  club_category: {
    category_id: string;
    season_id: string;
    club: {name: string; short_name: string | null};
  };
}

interface ExcelMatch {
  date: string;
  time: string;
  matchNumber: string;
  homeTeam: string;
  awayTeam: string;
  category: string;
  /** Optional 7th column — derived from the match date when left empty. */
  matchweek?: string;
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

      const {data: categories, error: categoriesError} = await supabase
        .from('categories')
        .select('id, name');

      // Read teams from club_category_teams rather than the `teams` view: that
      // view sits on the teams_with_details materialized view, whose refresh
      // triggers only pg_notify() and therefore never actually refresh it. The
      // preview in ExcelImportModal reads this same live data, so both sides
      // must agree on which teams exist.
      const {data: teams, error: teamsError} = await supabase
        .from('club_category_teams')
        .select(
          `
          id,
          team_suffix,
          club_category:club_categories!inner(
            category_id,
            season_id,
            club:clubs!inner(name, short_name)
          )
        `
        )
        .eq('is_active', true)
        .eq('club_category.season_id', seasonId);

      // Get season start date for matchweek calculation
      const {data: season} = await supabase
        .from('seasons')
        .select('start_date')
        .eq('id', seasonId)
        .single();

      if (categoriesError || teamsError || !categories || !teams) {
        result.errors.push(
          `Nepodařilo se načíst kategorie nebo týmy: ${categoriesError?.message || teamsError?.message || 'prázdná odpověď'}`
        );
        return result;
      }

      // Names must be built exactly like useTeams does, since that is what the
      // preview validated the file against.
      const teamCandidates: ImportTeamCandidate[] = (teams as unknown as ClubCategoryTeamRow[]).map(
        (team) => ({
          id: team.id,
          name: `${team.club_category.club.name} ${team.team_suffix}`,
          short_name: `${team.club_category.club.short_name || team.club_category.club.name} ${team.team_suffix}`,
          category_id: team.club_category.category_id,
          season_id: team.club_category.season_id,
        })
      );

      if (teamCandidates.length === 0) {
        result.errors.push('Pro vybranou sezónu nejsou evidovány žádné týmy');
        return result;
      }

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

          // Check for duplicate matches. maybeSingle(), not single(): finding
          // nothing is the expected outcome here, and single() answers that
          // with a PGRST116 error and an HTTP 406 for every imported row.
          const {data: existingMatch, error: duplicateCheckError} = await supabase
            .from('matches')
            .select('id')
            .eq('category_id', category.id)
            .eq('season_id', seasonId)
            .eq('home_team_id', homeTeam.id)
            .eq('away_team_id', awayTeam.id)
            .eq('date', formattedDate)
            .eq('time', match.time)
            .maybeSingle();

          if (duplicateCheckError) {
            result.failed++;
            result.errors.push(
              `Nepodařilo se ověřit duplicitu zápasu ${match.matchNumber}: ${duplicateCheckError.message}`
            );
            continue;
          }

          if (existingMatch) {
            result.failed++;
            result.errors.push(
              `Duplicitní zápas: ${match.homeTeam} vs ${match.awayTeam} dne ${formattedDate} v ${match.time}`
            );
            continue;
          }

          // Prefer the matchweek stated in the file; deriving it from the date
          // is only a rough fallback for files that omit the column.
          const {match: parsedMatchweek, error: matchweekError} = parseImportMatchweek(
            match.matchweek
          );

          if (matchweekError) {
            result.failed++;
            result.errors.push(`${matchweekError} (zápas ${match.matchNumber})`);
            continue;
          }

          const matchweek = parsedMatchweek ?? determineMatchweek(dateObj, season?.start_date);

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
            matchweek: matchweek, // From the file, or derived from the date
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
