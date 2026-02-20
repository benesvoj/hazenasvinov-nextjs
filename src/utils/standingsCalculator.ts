import {supabaseBrowserClient} from '@/utils/supabase/client';

import {Match} from '@/types';

/**
 * Calculates standings for a specific category and season
 * @param categoryId - The category ID
 * @param seasonId - The season ID
 * @param isSeasonClosed - Function to check if season is closed
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function calculateStandings(
  categoryId: string,
  seasonId: string,
  isSeasonClosed: boolean
): Promise<{success: boolean; error?: string}> {
  // Validate input parameters FIRST - before any database operations
  const supabase = supabaseBrowserClient();

  if (!categoryId || categoryId.trim() === '') {
    return {success: false, error: 'Neplatné ID kategorie'};
  }

  if (!seasonId || seasonId.trim() === '') {
    return {success: false, error: 'Neplatné ID sezóny'};
  }

  if (isSeasonClosed) {
    return {success: false, error: 'Nelze přepočítat tabulku pro uzavřenou sezónu'};
  }

  try {
    // Get completed matches for the selected category and season
    let {data: completedMatches, error: matchesError} = await supabase
      .from('matches')
      .select('*')
      .eq('category_id', categoryId)
      .eq('season_id', seasonId)
      .eq('status', 'completed');

    if (matchesError) throw matchesError;

    // Note: We can generate standings even without completed matches
    if (!completedMatches) {
      completedMatches = [];
    }

    // Get teams for this category and season
    let teamCategories;
    let teamsError;

    // Try club_categories first, fallback to team_categories
    try {
      const clubResult = await supabase
        .from('club_categories')
        .select(
          `
          club_id,
          club:clubs(
            id,
            name
          ),
          club_category_teams(
            id,
            team_suffix
          )
        `
        )
        .eq('category_id', categoryId)
        .eq('season_id', seasonId)
        .eq('is_active', true);

      if (clubResult.data && clubResult.data.length > 0) {
        // New club-based system
        teamCategories = clubResult.data.flatMap(
          (cc: any) =>
            cc.club_category_teams?.map((ct: any) => ({
              team_id: ct.id,
              club_id: cc.club_id,
            })) || []
        );
      }
    } catch (error) {
      teamsError = error;
    }

    if (teamsError) throw teamsError;

    if (!teamCategories || teamCategories.length === 0) {
      return {success: false, error: 'Žádné týmy v této kategorii a sezóně'};
    }

    // Initialize standings for all teams
    const standingsMap = new Map<string, any>();
    teamCategories.forEach((tc: any) => {
      standingsMap.set(tc.team_id, {
        // Omit id field - let database generate it
        team_id: tc.team_id,
        club_id: tc.club_id,
        category_id: categoryId,
        season_id: seasonId,
        position: 0,
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        points: 0,
      });
    });

    // Calculate standings from matches
    completedMatches.forEach((match: Match) => {
      if (match.home_score === null || match.away_score === null) return;

      const homeStanding = standingsMap.get(match.home_team_id);
      const awayStanding = standingsMap.get(match.away_team_id);

      if (homeStanding && awayStanding) {
        // Type assertion: we've already checked that scores are not null
        const homeScore = match.home_score as number;
        const awayScore = match.away_score as number;

        // Update matches played
        homeStanding.matches++;
        awayStanding.matches++;

        // Update goals
        homeStanding.goals_for += homeScore;
        homeStanding.goals_against += awayScore;
        awayStanding.goals_for += awayScore;
        awayStanding.goals_against += homeScore;

        // Update points and wins/draws/losses
        if (homeScore > awayScore) {
          // Home team wins
          homeStanding.wins++;
          homeStanding.points += 2;
          awayStanding.losses++;
        } else if (homeScore < awayScore) {
          // Away team wins
          awayStanding.wins++;
          awayStanding.points += 2;
          homeStanding.losses++;
        } else {
          // Draw
          homeStanding.draws++;
          homeStanding.points += 1;
          awayStanding.draws++;
          awayStanding.points += 1;
        }
      }
    });

    // Convert to array and sort by points, then goal difference
    const standingsArray = Array.from(standingsMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aGoalDiff = a.goals_for - a.goals_against;
      const bGoalDiff = b.goals_for - b.goals_against;
      if (bGoalDiff !== aGoalDiff) return bGoalDiff - aGoalDiff;
      return b.goals_for - a.goals_for;
    });

    // Update positions
    standingsArray.forEach((standing, index) => {
      standing.position = index + 1;
    });

    // Upsert standings to database
    const {error: upsertError} = await supabase.from('standings').upsert(standingsArray, {
      onConflict: 'category_id,season_id,team_id',
    });

    if (upsertError) throw upsertError;

    return {success: true};
  } catch (error) {
    console.error('Error calculating standings:', error);
    return {success: false, error: 'Chyba při výpočtu tabulky'};
  }
}
