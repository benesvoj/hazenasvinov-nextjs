'use client';
import {useState, useEffect} from 'react';

import {createClient} from '@/utils/supabase/client';

import {Match} from '@/types';

interface UseFetchVideoMatchResult {
  match: Match | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch match data related to a video
 * @param videoId - The ID of the video
 * @returns Match data, loading state, and error state
 */
export function useFetchVideoMatch(videoId: string | null): UseFetchVideoMatchResult {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) {
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

        // First, get the match_id from the video
        const {data: videoData, error: videoError} = await supabase
          .from('videos')
          .select('match_id')
          .eq('id', videoId)
          .single();

        if (videoError) {
          throw videoError;
        }

        if (!videoData.match_id) {
          setMatch(null);
          return;
        }

        // Fetch the match data with team details
        const {data: matchData, error: matchError} = await supabase
          .from('matches')
          .select(
            `
            *,
            home_team:teams!matches_home_team_id_fkey(
              id,
              name,
              short_name,
              logo_url
            ),
            away_team:teams!matches_away_team_id_fkey(
              id,
              name,
              short_name,
              logo_url
            ),
            category:categories(
              id,
              name,
              code
            ),
            season:seasons(
              id,
              name,
              start_date,
              end_date
            )
          `
          )
          .eq('id', videoData.match_id)
          .single();

        if (matchError) {
          throw matchError;
        }

        setMatch(matchData);
      } catch (err) {
        console.error('Error fetching video match:', err);
        setError(err instanceof Error ? err.message : 'Chyba při načítání zápasu');
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [videoId]);

  return {
    match,
    loading,
    error,
  };
}
