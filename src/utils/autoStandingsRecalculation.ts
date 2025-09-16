import {createClient} from '@/utils/supabase/client';
import {calculateStandings} from './standingsCalculator';

/**
 * Automatically recalculates standings for a match's category and season
 * @param matchId - The match ID
 * @param categoryId - The category ID (optional, will be fetched if not provided)
 * @param seasonId - The season ID (optional, will be fetched if not provided)
 * @returns Promise<{ success: boolean; error?: string; recalculated?: boolean }>
 */
export async function autoRecalculateStandings(
  matchId: string,
  categoryId?: string,
  seasonId?: string
): Promise<{success: boolean; error?: string; recalculated?: boolean}> {
  try {
    const supabase = createClient();

    // If categoryId or seasonId not provided, fetch them from the match
    let finalCategoryId = categoryId;
    let finalSeasonId = seasonId;

    if (!finalCategoryId || !finalSeasonId) {
      const {data: match, error: matchError} = await supabase
        .from('matches')
        .select('category_id, season_id')
        .eq('id', matchId)
        .single();

      if (matchError) {
        console.error('Error fetching match data for standings recalculation:', matchError);
        return {success: false, error: 'Nepodařilo se načíst data zápasu'};
      }

      if (!match) {
        return {success: false, error: 'Zápas nebyl nalezen'};
      }

      finalCategoryId = match.category_id;
      finalSeasonId = match.season_id;
    }

    if (!finalCategoryId || !finalSeasonId) {
      return {success: false, error: 'Chybí ID kategorie nebo sezóny'};
    }

    // Check if season is closed
    const {data: season, error: seasonError} = await supabase
      .from('seasons')
      .select('is_closed')
      .eq('id', finalSeasonId)
      .single();

    if (seasonError) {
      console.error('Error checking season status:', seasonError);
      return {success: false, error: 'Nepodařilo se ověřit stav sezóny'};
    }

    if (season?.is_closed) {
      console.log('Season is closed, skipping standings recalculation');
      return {success: true, recalculated: false};
    }

    // Check if standings exist for this category/season
    const {data: existingStandings, error: standingsCheckError} = await supabase
      .from('standings')
      .select('id')
      .eq('category_id', finalCategoryId)
      .eq('season_id', finalSeasonId)
      .limit(1);

    if (standingsCheckError) {
      console.error('Error checking existing standings:', standingsCheckError);
      return {success: false, error: 'Nepodařilo se ověřit existující tabulku'};
    }

    // If no standings exist, don't recalculate (they need to be generated first)
    if (!existingStandings || existingStandings.length === 0) {
      console.log('No standings exist for this category/season, skipping recalculation');
      return {success: true, recalculated: false};
    }

    // Recalculate standings
    console.log(
      `Recalculating standings for category ${finalCategoryId} and season ${finalSeasonId}`
    );

    const result = await calculateStandings(
      finalCategoryId,
      finalSeasonId,
      () => season?.is_closed || false
    );

    if (result.success) {
      console.log('Standings recalculated successfully');
      return {success: true, recalculated: true};
    } else {
      console.error('Error recalculating standings:', result.error);
      return {success: false, error: result.error || 'Chyba při přepočtu tabulky'};
    }
  } catch (error) {
    console.error('Unexpected error in auto standings recalculation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Neočekávaná chyba při přepočtu tabulky',
    };
  }
}

/**
 * Recalculates standings for multiple matches (useful for batch operations)
 * @param matchIds - Array of match IDs
 * @returns Promise<{ success: boolean; error?: string; recalculatedCount?: number }>
 */
export async function autoRecalculateStandingsForMatches(
  matchIds: string[]
): Promise<{success: boolean; error?: string; recalculatedCount?: number}> {
  try {
    const supabase = createClient();

    // Get unique category/season combinations from matches
    const {data: matches, error: matchError} = await supabase
      .from('matches')
      .select('category_id, season_id')
      .in('id', matchIds);

    if (matchError) {
      console.error('Error fetching matches for batch standings recalculation:', matchError);
      return {success: false, error: 'Nepodařilo se načíst data zápasů'};
    }

    if (!matches || matches.length === 0) {
      return {success: true, recalculatedCount: 0};
    }

    // Get unique category/season combinations
    const uniqueCombinations = new Set(
      matches.map(
        (match: {category_id: string; season_id: string}) =>
          `${match.category_id}-${match.season_id}`
      )
    );

    let recalculatedCount = 0;
    const errors: string[] = [];

    // Recalculate standings for each unique combination
    for (const combination of uniqueCombinations) {
      const [categoryId, seasonId] = (combination as string).split('-');

      const result = await autoRecalculateStandings('', categoryId, seasonId);

      if (result.success && result.recalculated) {
        recalculatedCount++;
      } else if (result.error) {
        errors.push(`${categoryId}/${seasonId}: ${result.error}`);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: `Chyby při přepočtu tabulek: ${errors.join('; ')}`,
        recalculatedCount,
      };
    }

    return {success: true, recalculatedCount};
  } catch (error) {
    console.error('Unexpected error in batch standings recalculation:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Neočekávaná chyba při dávkovém přepočtu tabulek',
    };
  }
}
