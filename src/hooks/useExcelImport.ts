import {useCallback} from 'react';
import {createClient} from '@/utils/supabase/client';

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
  const supabase = createClient();

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

      // Get categories and teams for mapping
      const {data: categories} = await supabase.from('categories').select('id, name');

      const {data: teams} = await supabase.from('teams').select('id, name, short_name');

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

      // Process each match
      for (const match of matches) {
        try {
          // Find category ID
          const category = categories.find(
            (cat: any) => cat.name.toLowerCase() === match.category.toLowerCase()
          );

          if (!category) {
            result.failed++;
            result.errors.push(
              `Kategorie "${match.category}" nebyla nalezena pro zápas ${match.matchNumber}`
            );
            continue;
          }

          // Find team IDs with better matching and debugging
          const cleanHomeTeam = match.homeTeam.trim().toLowerCase();
          const cleanAwayTeam = match.awayTeam.trim().toLowerCase();

          // Debug: Log what we're looking for
          console.log('Looking for home team:', {
            searchTerm: cleanHomeTeam,
            availableTeams: teams.map((t: any) => ({
              name: t.name,
              short_name: t.short_name,
              nameLower: t.name.toLowerCase(),
              shortNameLower: t.short_name?.toLowerCase(),
            })),
          });

          const homeTeam = teams.find((team: any) => {
            const teamNameLower = team.name.trim().toLowerCase();
            const teamShortNameLower = team.short_name?.trim().toLowerCase();

            return (
              teamNameLower === cleanHomeTeam ||
              teamShortNameLower === cleanHomeTeam ||
              teamNameLower.includes(cleanHomeTeam) ||
              cleanHomeTeam.includes(teamNameLower) ||
              (teamShortNameLower &&
                (teamShortNameLower.includes(cleanHomeTeam) ||
                  cleanHomeTeam.includes(teamShortNameLower)))
            );
          });

          const awayTeam = teams.find((team: any) => {
            const teamNameLower = team.name.trim().toLowerCase();
            const teamShortNameLower = team.short_name?.trim().toLowerCase();

            return (
              teamNameLower === cleanAwayTeam ||
              teamShortNameLower === cleanAwayTeam ||
              teamNameLower.includes(cleanAwayTeam) ||
              cleanAwayTeam.includes(teamNameLower) ||
              (teamShortNameLower &&
                (teamShortNameLower.includes(cleanAwayTeam) ||
                  cleanAwayTeam.includes(teamShortNameLower)))
            );
          });

          if (!homeTeam) {
            result.failed++;
            const availableTeamNames = teams
              .map((t: any) => `"${t.name}"${t.short_name ? ` (${t.short_name})` : ''}`)
              .join(', ');
            result.errors.push(
              `Domácí tým "${match.homeTeam}" nebyl nalezen. Dostupné týmy: ${availableTeamNames}`
            );
            continue;
          }

          if (!awayTeam) {
            result.failed++;
            const availableTeamNames = teams
              .map((t: any) => `"${t.name}"${t.short_name ? ` (${t.short_name})` : ''}`)
              .join(', ');
            result.errors.push(
              `Hostující tým "${match.awayTeam}" nebyl nalezen. Dostupné týmy: ${availableTeamNames}`
            );
            continue;
          }

          // Debug: Log what we found
          console.log('Teams found:', {
            homeTeam: {id: homeTeam.id, name: homeTeam.name, short_name: homeTeam.short_name},
            awayTeam: {id: awayTeam.id, name: awayTeam.name, short_name: awayTeam.short_name},
          });

          // Parse date and time - handle European date format (DD.MM.YYYY)
          let dateObj: Date;
          if (match.date.includes('.')) {
            // European format: DD.MM.YYYY
            const [day, month, year] = match.date.split('.');
            // Create date string in YYYY-MM-DD format to avoid timezone issues
            const dateString = `${parseInt(year)}-${String(parseInt(month)).padStart(2, '0')}-${String(parseInt(day)).padStart(2, '0')}`;
            dateObj = new Date(dateString + 'T00:00:00');

            // Debug: Log date parsing details
            console.log('🔍 Date parsing debug:', {
              originalDate: match.date,
              parsedComponents: {day, month, year},
              dateString: dateString,
              dateObj: dateObj,
              dateObjLocal: dateObj.toLocaleDateString('cs-CZ'),
              dateObjISO: dateObj.toISOString(),
              getFullYear: dateObj.getFullYear(),
              getMonth: dateObj.getMonth() + 1,
              getDate: dateObj.getDate(),
            });
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

          // Debug: Log final formatted date
          console.log('🔍 Final date debug:', {
            originalDate: match.date,
            formattedDate: formattedDate,
            dateObj: dateObj,
            dateObjLocal: dateObj.toLocaleDateString('cs-CZ'),
          });

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
            competition: 'league', // Default competition type
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
