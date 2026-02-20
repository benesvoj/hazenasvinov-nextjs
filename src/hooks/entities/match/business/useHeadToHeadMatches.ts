import {useQuery} from '@tanstack/react-query';

import {useSupabaseClient} from '@/hooks';
import {Match} from '@/types';

interface UseHeadToHeadMatchesOptions {
  categoryId?: string;
  opponentTeamId?: string;
  ownClubTeamId?: string;
  limit?: number;
}

interface UseHeadToHeadMatchesResult {
  data: Match[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch head-to-head matches between our club and a specific opponent
 * Searches across ALL seasons by finding teams via club and category relationships
 */
export function useHeadToHeadMatches({
  categoryId,
  opponentTeamId,
  ownClubTeamId,
  limit = 10,
}: UseHeadToHeadMatchesOptions): UseHeadToHeadMatchesResult {
  const queryKey = ['headToHeadMatches', categoryId, opponentTeamId, ownClubTeamId, limit];

  const supabase = useSupabaseClient();

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!categoryId || !opponentTeamId || !ownClubTeamId) {
        return [];
      }

      // Step 1: Get the opponent's club ID from the opponent team ID
      const {data: opponentTeamData, error: opponentTeamError} = await supabase
        .from('club_category_teams')
        .select(
          `
          id,
          club_category:club_categories(
            club_id,
            club:clubs(id, name, short_name, is_own_club)
          )
        `
        )
        .eq('id', opponentTeamId)
        .single();

      if (opponentTeamError || !opponentTeamData) {
        throw new Error('Failed to find opponent team data');
      }

      const opponentClubId = opponentTeamData.club_category?.club_id;
      if (!opponentClubId) {
        throw new Error('Failed to find opponent club ID');
      }

      // Step 2: Get our club ID from our team ID
      const {data: ownTeamData, error: ownTeamError} = await supabase
        .from('club_category_teams')
        .select(
          `
          id,
          club_category:club_categories(
            club_id,
            club:clubs(id, name, short_name, is_own_club)
          )
        `
        )
        .eq('id', ownClubTeamId)
        .single();

      if (ownTeamError || !ownTeamData) {
        throw new Error('Failed to find own team data');
      }

      const ownClubId = ownTeamData.club_category?.club_id;
      if (!ownClubId) {
        throw new Error('Failed to find own club ID');
      }

      // Step 3: Find all teams from our club in this category (across all seasons)
      const {data: ownClubTeams, error: ownClubTeamsError} = await supabase
        .from('club_category_teams')
        .select(
          `
          id,
          club_category:club_categories!inner(
            club_id,
            club:clubs(id, name, short_name, is_own_club)
          )
        `
        )
        .eq('club_category.club_id', ownClubId)
        .eq('club_category.category_id', categoryId);

      if (ownClubTeamsError) {
        throw ownClubTeamsError;
      }
      // Step 4: Find all teams from opponent club in this category (across all seasons)
      const {data: opponentClubTeams, error: opponentClubTeamsError} = await supabase
        .from('club_category_teams')
        .select(
          `
          id,
          club_category:club_categories!inner(
            club_id,
            club:clubs(id, name, short_name, is_own_club)
          )
        `
        )
        .eq('club_category.club_id', opponentClubId)
        .eq('club_category.category_id', categoryId);

      if (opponentClubTeamsError) {
        throw opponentClubTeamsError;
      }
      if (
        !ownClubTeams ||
        !opponentClubTeams ||
        ownClubTeams.length === 0 ||
        opponentClubTeams.length === 0
      ) {
        return [];
      }

      // Step 5: Get all team IDs for both clubs
      const ownClubTeamIds = ownClubTeams.map((team: any) => team.id);
      const opponentClubTeamIds = opponentClubTeams.map((team: any) => team.id);

      // Step 6: Find all matches between our teams and opponent teams
      const {data: allMatches, error: matchesError} = await supabase
        .from('matches')
        .select(
          `
          id,
          date,
          time,
          venue,
          competition,
          status,
          home_score,
          away_score,
          home_score_halftime,
          away_score_halftime,
          matchweek,
          match_number,
          category_id,
          season_id,
          home_team_id,
          away_team_id,
          created_at,
          updated_at,
          home_team:home_team_id(
            id,
            team_suffix,
            club_category:club_categories(
              club:clubs(id, name, short_name, logo_url, is_own_club)
            )
          ),
          away_team:away_team_id(
            id,
            team_suffix,
            club_category:club_categories(
              club:clubs(id, name, short_name, logo_url, is_own_club)
            )
          ),
          category:categories(
            id,
            name,
            description,
            age_group,
            gender
          ),
          season:seasons(
            id,
            name,
            start_date,
            end_date,
            is_active
          )
        `
        )
        .eq('category_id', categoryId)
        .eq('status', 'completed')
        .or(
          `and(home_team_id.in.(${ownClubTeamIds.join(',')}),away_team_id.in.(${opponentClubTeamIds.join(',')})),and(home_team_id.in.(${opponentClubTeamIds.join(',')}),away_team_id.in.(${ownClubTeamIds.join(',')}))`
        )
        .order('date', {ascending: false});

      if (matchesError) {
        throw matchesError;
      }

      if (!allMatches) {
        return [];
      }
      const headToHeadMatches = allMatches;

      // Step 7: Add proper team names for display
      const matchesWithTeamNames = headToHeadMatches.map((match: any) => {
        const homeClub = match.home_team?.club_category?.club;
        const awayClub = match.away_team?.club_category?.club;
        const homeTeamSuffix = match.home_team?.team_suffix;
        const awayTeamSuffix = match.away_team?.team_suffix;

        return {
          ...match,
          home_team: {
            ...match.home_team,
            name: homeClub
              ? `${homeClub.name}${homeTeamSuffix ? ` ${homeTeamSuffix}` : ''}`
              : 'Unknown Team',
            short_name: homeClub
              ? `${homeClub.short_name}${homeTeamSuffix ? ` ${homeTeamSuffix}` : ''}`
              : 'Unknown',
            logo_url: homeClub?.logo_url,
          },
          away_team: {
            ...match.away_team,
            name: awayClub
              ? `${awayClub.name}${awayTeamSuffix ? ` ${awayTeamSuffix}` : ''}`
              : 'Unknown Team',
            short_name: awayClub
              ? `${awayClub.short_name}${awayTeamSuffix ? ` ${awayTeamSuffix}` : ''}`
              : 'Unknown',
            logo_url: awayClub?.logo_url,
          },
        };
      });

      // Limit results and return
      const finalResult = matchesWithTeamNames.slice(0, limit);

      return finalResult;
    },
    enabled: !!(categoryId && opponentTeamId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
