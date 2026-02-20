'use client';

import {useCallback, useEffect, useState} from 'react';

import {useSupabaseClient} from '@/hooks';
import {Video} from '@/types';

interface UseMatchVideosResult {
  videos: Video[];
  loading: boolean;
  error: string | null;
  addVideo: (videoId: string) => Promise<void>;
  removeVideo: (videoId: string) => Promise<void>;
  refreshVideos: () => Promise<void>;
}

/**
 * Hook to manage video for a specific match
 * @param matchId - The ID of the match
 * @returns Object containing video, loading state, error state, and management functions
 */
export function useMatchVideos(matchId: string | null): UseMatchVideosResult {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabaseClient();

  const fetchVideos = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        console.warn('No match ID provided to fetchVideos');
        setVideos([]);
        return;
      }
      // Check if match_videos table exists first
      const {data: tableCheck, error: tableError} = await supabase
        .from('match_videos')
        .select('id')
        .limit(1);

      if (tableError && tableError.code === 'PGRST116') {
        // Table doesn't exist yet, return empty array
        console.warn('match_videos table does not exist yet. Please run the migration script.');
        setVideos([]);
        return;
      }

      // First get the video IDs from match_videos
      const {data: matchVideoIds, error: matchVideoIdsError} = await supabase
        .from('match_videos')
        .select('video_id')
        .eq('match_id', id);

      if (matchVideoIdsError) {
        console.error('Error fetching match video IDs:', matchVideoIdsError);
        throw matchVideoIdsError;
      }

      if (!matchVideoIds || matchVideoIds.length === 0) {
        setVideos([]);
        return;
      }

      // Then fetch the video with their category
      const videoIds = matchVideoIds.map((item: any) => item.video_id);
      const {data: videosData, error: videosError} = await supabase
        .from('videos')
        .select(
          `
          id,
          title,
          description,
          youtube_url,
          youtube_id,
          thumbnail_url,
          recording_date,
          category_id,
          is_active,
          created_at,
          updated_at,
          created_by,
          updated_by,
          categories(
            id,
            name
          )
        `
        )
        .in('id', videoIds)
        .eq('is_active', true)
        .order('created_at', {ascending: false});

      if (videosError) {
        console.error('Error fetching video:', videosError);
        throw videosError;
      }

      const processedVideos =
        videosData?.map((video: any) => ({
          ...video,
          category: video.categories,
        })) || [];

      setVideos(processedVideos);
    } catch (err) {
      console.error('Error fetching match video:', err);
      setError(err instanceof Error ? err.message : 'Chyba při načítání videí zápasu');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addVideo = useCallback(
    async (videoId: string) => {
      if (!matchId) return;

      try {
        setError(null);

        const {error: insertError} = await supabase.from('match_videos').insert({
          match_id: matchId,
          video_id: videoId,
        });

        if (insertError) {
          if (insertError.code === 'PGRST116') {
            console.warn('match_videos table does not exist yet. Please run the migration script.');
            setError('Tabulka match_videos neexistuje. Spusťte migrační skript.');
            return;
          }
          throw insertError;
        }

        // Refresh video after adding
        await fetchVideos(matchId);
      } catch (err) {
        console.error('Error adding video to match:', err);
        setError(err instanceof Error ? err.message : 'Chyba při přidávání videa k zápasu');
      }
    },
    [matchId, fetchVideos]
  );

  const removeVideo = useCallback(
    async (videoId: string) => {
      if (!matchId) return;

      try {
        setError(null);

        const {error: deleteError} = await supabase
          .from('match_videos')
          .delete()
          .eq('match_id', matchId)
          .eq('video_id', videoId);

        if (deleteError) {
          if (deleteError.code === 'PGRST116') {
            console.warn('match_videos table does not exist yet. Please run the migration script.');
            setError('Tabulka match_videos neexistuje. Spusťte migrační skript.');
            return;
          }
          throw deleteError;
        }

        // Refresh video after removing
        await fetchVideos(matchId);
      } catch (err) {
        console.error('Error removing video from match:', err);
        setError(err instanceof Error ? err.message : 'Chyba při odstraňování videa ze zápasu');
      }
    },
    [matchId, fetchVideos]
  );

  const refreshVideos = useCallback(async () => {
    if (matchId) {
      await fetchVideos(matchId);
    }
  }, [matchId, fetchVideos]);

  useEffect(() => {
    if (!matchId) {
      setVideos([]);
      setLoading(false);
      setError(null);
      return;
    }

    fetchVideos(matchId);
  }, [matchId, fetchVideos]);

  return {
    videos,
    loading,
    error,
    addVideo,
    removeVideo,
    refreshVideos,
  };
}
