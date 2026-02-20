import {supabaseBrowserClient} from '@/utils/supabase/client';

interface InitialStanding {
  team_id: string;
  club_id?: string;
  category_id: string;
  season_id: string;
  position: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
}

interface TeamCategory {
  team_id: string;
  club_id?: string;
  team?: {
    id: string;
    name: string;
  };
}

/**
 * Generates initial standings for a specific category and season
 * @param categoryId - The category ID
 * @param seasonId - The season ID
 * @param isSeasonClosed - Function to check if season is closed
 * @returns Promise<{ success: boolean; error?: string; standings?: InitialStanding[] }>
 */
export async function generateInitialStandings(
  categoryId: string,
  seasonId: string,
  isSeasonClosed: boolean
): Promise<{success: boolean; error?: string; standings?: InitialStanding[]}> {
  // Validate input parameters FIRST - before any database operations
  const supabase = supabaseBrowserClient();

  if (!categoryId || categoryId.trim() === '') {
    return {success: false, error: 'Neplatné ID kategorie'};
  }

  if (!seasonId || seasonId.trim() === '') {
    return {success: false, error: 'Neplatné ID sezóny'};
  }

  if (isSeasonClosed) {
    return {success: false, error: 'Nelze generovat tabulku pro uzavřenou sezónu'};
  }

  try {
    console.log('🔍 Starting initial standings generation...', {
      categoryId,
      seasonId,
    });

    // Get teams for this category and season
    let teamCategories: TeamCategory[] = [];
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
        teamCategories = clubResult.data.flatMap((cc: any) => {
          // Check if this club has multiple teams in this category
          const teamCount = cc.club_category_teams?.length || 0;

          return (
            cc.club_category_teams?.map((ct: any) => {
              // Only show suffix if club has multiple teams in this category
              const shouldShowSuffix = teamCount > 1;
              const displayName = shouldShowSuffix
                ? `${cc.club.name} ${ct.team_suffix}`
                : cc.club.name;

              return {
                team_id: ct.id,
                club_id: cc.club_id,
                team: {id: ct.id, name: displayName},
              };
            }) || []
          );
        });
      }
    } catch (error) {
      teamsError = error;
    }

    if (teamsError) throw teamsError;

    console.log('🔍 Team category found:', {
      teamCategoriesCount: teamCategories?.length || 0,
      teamCategories: teamCategories,
    });

    if (!teamCategories || teamCategories.length === 0) {
      return {success: false, error: 'Žádné týmy v této kategorii a sezóně'};
    }

    // Check if standings already exist
    const {data: existingStandings, error: standingsError} = await supabase
      .from('standings')
      .select('id')
      .eq('category_id', categoryId)
      .eq('season_id', seasonId);

    if (standingsError) throw standingsError;

    console.log('🔍 Existing standings check:', {
      existingStandingsCount: existingStandings?.length || 0,
      existingStandings: existingStandings,
    });

    // If standings already exist, don't overwrite them
    if (existingStandings && existingStandings.length > 0) {
      return {
        success: false,
        error: 'Tabulka již existuje. Použijte "Přepočítat tabulku" pro aktualizaci.',
      };
    }

    // Generate initial standings for all teams
    const initialStandings: InitialStanding[] = teamCategories.map((tc: any, index: number) => ({
      team_id: tc.team_id,
      club_id: tc.club_id,
      category_id: categoryId,
      season_id: seasonId,
      position: index + 1,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      points: 0,
    }));

    console.log('🔍 Generated initial standings:', {
      initialStandingsCount: initialStandings.length,
      initialStandings: initialStandings,
    });

    // Insert initial standings
    console.log('🔍 Attempting to insert standings...');

    // Try bulk insert first
    let {data: insertResult, error: insertError} = await supabase
      .from('standings')
      .insert(initialStandings)
      .select();

    if (insertError) {
      console.error('❌ Bulk insert failed, trying individual inserts...', insertError);

      // Fallback: Insert teams one by one
      const successfulInserts = [];
      const failedInserts = [];

      for (const standing of initialStandings) {
        try {
          const {data: singleResult, error: singleError} = await supabase
            .from('standings')
            .insert(standing)
            .select();

          if (singleError) {
            console.error(`❌ Failed to insert team ${standing.team_id}:`, singleError);
            failedInserts.push({standing, error: singleError});
          } else {
            console.log(`✅ Successfully inserted team ${standing.team_id}:`, singleResult);
            successfulInserts.push(singleResult[0]);
          }
        } catch (singleError) {
          console.error(`❌ Exception inserting team ${standing.team_id}:`, singleError);
          failedInserts.push({standing, error: singleError});
        }
      }

      console.log('🔍 Individual insert results:', {
        successfulInserts: successfulInserts.length,
        failedInserts: failedInserts.length,
        failedInsertDetails: failedInserts,
      });

      if (successfulInserts.length === 0) {
        throw new Error(`Failed to insert any standings. ${failedInserts.length} failures.`);
      }

      // Use successful inserts as result
      insertResult = successfulInserts;
    }

    console.log('🔍 Final insert result:', {
      insertResultCount: insertResult?.length || 0,
      insertResultData: insertResult,
    });

    // Verify the standings were actually created
    const {data: verifyStandings, error: verifyError} = await supabase
      .from('standings')
      .select('*')
      .eq('category_id', categoryId)
      .eq('season_id', seasonId);

    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
    } else {
      console.log('🔍 Verification result:', {
        verifyStandingsCount: verifyStandings?.length || 0,
        verifyStandings: verifyStandings,
      });
    }

    return {success: true, standings: initialStandings};
  } catch (error) {
    console.error('❌ Error in generateInitialStandings:', error);
    return {
      success: false,
      error: `Chyba při generování počáteční tabulky: ${
        error instanceof Error ? error.message : 'Neznámá chyba'
      }`,
    };
  }
}
