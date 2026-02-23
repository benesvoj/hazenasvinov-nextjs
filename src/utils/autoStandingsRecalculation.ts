import {supabaseBrowserClient} from '@/utils/supabase/client';

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
  const supabase = supabaseBrowserClient();

  try {
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

    const result = await calculateStandings(finalCategoryId, finalSeasonId, season?.is_closed);

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
