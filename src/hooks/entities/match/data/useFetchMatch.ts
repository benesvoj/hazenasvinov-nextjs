'use client';
import {useState, useEffect, useCallback} from 'react';

import {translations} from '@/lib/translations';

import {createClient} from '@/utils/supabase/client';

import {Category, Season, Team} from '@/types';

/**
 * TransformedMatch interface for the match data
 * This is the interface for the match data that is used in the app
 * It is transformed from the database data to be used in the app
 * TODO: use proper types or move to types folder
 */
interface TransformedMatch {
  id: string;
  category_id: string;
  season_id: string;
  date: string;
  time: string;
  home_team_id: string;
  away_team_id: string;
  venue: string;
  competition: string;
  home_score?: number;
  away_score?: number;
  status: 'upcoming' | 'completed';
  matchweek?: number;
  result?: 'win' | 'loss' | 'draw';
  is_home: boolean;
  home_team: Team;
  away_team: Team;
  category: Category;
  season: Season;
}

// Helper function to safely get team display name
function getTeamDisplayNameSafe(
  clubName: string | undefined,
  teamSuffix: string,
  teamCount: number,
  fallbackName: string
): string {
  if (!clubName) return fallbackName;

  // Only show suffix if club has multiple teams in this category
  if (teamCount > 1) {
    return `${clubName} ${teamSuffix}`;
  }

  return clubName;
}

export function useFetchMatch(matchId: string | null) {
  const [match, setMatch] = useState<TransformedMatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatch = useCallback(async () => {
    if (!matchId) return;

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const {data, error} = await supabase
        .from('matches')
        .select(
          `
          *,
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
          category:categories(id, name, description),
          season:seasons(name)
        `
        )
        .eq('id', matchId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Match not found - this is a valid case
          setError('Zápas nebyl nalezen');
          setMatch(null);
          return;
        }
        setError('Chyba při načítání zápasu');
        return;
      }

      // Get team counts for both clubs to determine if suffixes should be shown
      let homeTeamCount = 1;
      let awayTeamCount = 1;

      if (data.category_id) {
        try {
          // Fetch team counts for the clubs in this category
          const {data: teamCountsData, error: teamCountsError} = await supabase
            .from('club_categories')
            .select(
              `
              club_id,
              club_category_teams(id)
            `
            )
            .eq('category_id', data.category_id)
            .eq('is_active', true);

          if (teamCountsError) {
            console.warn('Error fetching team counts:', teamCountsError);
            // Continue with default values
          }

          if (teamCountsData) {
            const clubTeamCounts = new Map<string, number>();
            teamCountsData.forEach((cc: any) => {
              clubTeamCounts.set(cc.club_id, cc.club_category_teams?.length || 0);
            });

            // Get team counts for home and away clubs
            const homeClubId = data.home_team?.club_category?.club?.id;
            const awayClubId = data.away_team?.club_category?.club?.id;

            if (homeClubId) {
              homeTeamCount = clubTeamCounts.get(homeClubId) || 1;
            }
            if (awayClubId) {
              awayTeamCount = clubTeamCounts.get(awayClubId) || 1;
            }
          }
        } catch (countError) {
          console.warn('Could not fetch team counts, using default values:', countError);
        }
      }

      // Transform match data to use centralized team display logic
      const transformedMatch: TransformedMatch = {
        ...data,
        is_home: true, // Default value, can be determined based on your logic
        competition: data.competition || 'Neznámá soutěž',
        status: (data.status as 'upcoming' | 'completed') || 'upcoming',
        home_team: {
          id: data.home_team?.id,
          name: getTeamDisplayNameSafe(
            data.home_team?.club_category?.club?.name,
            data.home_team?.team_suffix || 'A',
            homeTeamCount,
            translations.team.unknownTeam
          ),
          short_name: data.home_team?.club_category?.club?.short_name,
          logo_url: data.home_team?.club_category?.club?.logo_url,
          is_own_club: data.home_team?.club_category?.club?.is_own_club || false,
        },
        away_team: {
          id: data.away_team?.id,
          name: getTeamDisplayNameSafe(
            data.away_team?.club_category?.club?.name,
            data.away_team?.team_suffix || 'A',
            awayTeamCount,
            translations.team.unknownTeam
          ),
          short_name: data.away_team?.club_category?.club?.short_name,
          logo_url: data.away_team?.club_category?.club?.logo_url,
          is_own_club: data.away_team?.club_category?.club?.is_own_club || false,
        },
      };

      setMatch(transformedMatch);
    } catch (error) {
      setError('Chyba při načítání zápasu');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  // Fetch match when matchId changes
  useEffect(() => {
    if (matchId) {
      fetchMatch();
    }
  }, [matchId, fetchMatch]);

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    if (matchId) {
      fetchMatch();
    }
  }, [matchId, fetchMatch]);

  return {
    match,
    loading,
    error,
    refetch,
  };
}
