'use client';
import {useState, useEffect} from 'react';

import {createClient} from '@/utils/supabase/client';

import {Video} from '@/types';

interface UseFetchMatchVideosResult {
  videos: Video[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch videos related to a match
 * @param matchId - The ID of the match
 * @returns Array of videos, loading state, and error state
 */
export function useFetchMatchVideos(matchId: string | null): UseFetchMatchVideosResult {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) {
      setVideos([]);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Fetch videos related to this match
        const {data: videosData, error: videosError} = await supabase
          .from('videos')
          .select(
            `
            *,
            category:categories(id, name),
            clubs:clubs(id, name, short_name),
            seasons:seasons(id, name, start_date, end_date)
          `
          )
          .eq('match_id', matchId)
          .eq('is_active', true)
          .order('recording_date', {ascending: false, nullsLast: true})
          .order('created_at', {ascending: false});

        if (videosError) {
          throw videosError;
        }

        setVideos(videosData || []);
      } catch (err) {
        console.error('Error fetching match videos:', err);
        setError(err instanceof Error ? err.message : 'Chyba při načítání videí');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [matchId]);

  return {
    videos,
    loading,
    error,
  };
}
