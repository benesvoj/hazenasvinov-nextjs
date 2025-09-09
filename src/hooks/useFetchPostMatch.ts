import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Match } from '@/types';

interface UseFetchPostMatchResult {
  match: Match | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch match data related to a blog post
 * @param postId - The ID of the blog post
 * @returns Match data, loading state, and error state
 */
export function useFetchPostMatch(postId: string | null): UseFetchPostMatchResult {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) {
      setMatch(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchMatch = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // First, get the match_id from the blog post
        const { data: postData, error: postError } = await supabase
          .from('blog_posts')
          .select('match_id')
          .eq('id', postId)
          .single();

        if (postError) {
          throw postError;
        }

        if (!postData.match_id) {
          setMatch(null);
          return;
        }

        // Fetch the match data with team details
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select(`
            id,
            category_id,
            season_id,
            date,
            time,
            venue,
            competition,
            status,
            home_score,
            away_score,
            matchweek,
            match_number,
            home_team_id,
            away_team_id,
            home_team:home_team_id(
              id,
              team_suffix,
              club_category:club_categories(
                club:clubs(
                  id,
                  name,
                  short_name,
                  logo_url,
                  is_own_club
                )
              )
            ),
            away_team:away_team_id(
              id,
              team_suffix,
              club_category:club_categories(
                club:clubs(
                  id,
                  name,
                  short_name,
                  logo_url,
                  is_own_club
                )
              )
            ),
            category:categories(id, code, name, description),
            season:seasons(id, name)
          `)
          .eq('id', postData.match_id)
          .single();

        if (matchError) {
          throw matchError;
        }

        if (matchData) {
          // Transform the match data to match our interface
          const transformedMatch: Match = {
            id: matchData.id,
            category_id: matchData.category_id,
            season_id: matchData.season_id,
            date: matchData.date,
            time: matchData.time,
            venue: matchData.venue,
            competition: matchData.competition,
            status: matchData.status,
            home_score: matchData.home_score,
            away_score: matchData.away_score,
            matchweek: matchData.matchweek,
            match_number: matchData.match_number,
            home_team_id: matchData.home_team_id,
            away_team_id: matchData.away_team_id,
            home_team: {
              id: matchData.home_team?.id || '',
              name: matchData.home_team?.club_category?.club?.name || 'Neznámý tým',
              logo_url: matchData.home_team?.club_category?.club?.logo_url,
              is_own_club: matchData.home_team?.club_category?.club?.is_own_club || false,
              short_name: matchData.home_team?.club_category?.club?.short_name,
              team_suffix: matchData.home_team?.team_suffix,
            },
            away_team: {
              id: matchData.away_team?.id || '',
              name: matchData.away_team?.club_category?.club?.name || 'Neznámý tým',
              logo_url: matchData.away_team?.club_category?.club?.logo_url,
              is_own_club: matchData.away_team?.club_category?.club?.is_own_club || false,
              short_name: matchData.away_team?.club_category?.club?.short_name,
              team_suffix: matchData.away_team?.team_suffix,
            },
            category: {
              code: matchData.category?.code || '',
              name: matchData.category?.name || '',
              description: matchData.category?.description,
            },
            season: {
              name: matchData.season?.name || '',
            },
            is_home: matchData.home_team?.club_category?.club?.is_own_club || false,
            result: matchData.home_score !== null && matchData.away_score !== null 
              ? (matchData.home_score > matchData.away_score ? 'win' : 
                 matchData.home_score < matchData.away_score ? 'loss' : 'draw')
              : undefined,
          };

          setMatch(transformedMatch);
        }
      } catch (err) {
        console.error('Error fetching post match:', err);
        setError(err instanceof Error ? err.message : 'Chyba při načítání zápasu');
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [postId]);

  return {
    match,
    loading,
    error
  };
}
