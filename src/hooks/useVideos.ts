import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Video, VideoFormData, VideoFilters } from '@/types';
import { useAuth } from './useAuth';

interface UseVideosOptions {
  assignedCategories?: string[];
  enableAccessControl?: boolean;
  itemsPerPage?: number;
}

export function useVideos(options: UseVideosOptions = {}) {
  const { assignedCategories = [], enableAccessControl = false, itemsPerPage = 20 } = options;
  const { user } = useAuth();
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Extract YouTube ID from URL
  const extractYouTubeId = useCallback((url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }, []);

  // Fetch videos with optional access control and pagination
  const fetchVideos = useCallback(async (filters: VideoFilters = {}, page: number = 1) => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Check if videos table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('videos')
        .select('id')
        .limit(1);

      if (tableError) {
        if (tableError.message.includes('relation "videos" does not exist')) {
          setError('Tabulka videí neexistuje. Spusťte: npm run setup:videos-table');
          setVideos([]);
          setTotalCount(0);
          return;
        }
        throw tableError;
      }

      // Build base query for counting total items
      let countQuery = supabase
        .from('videos')
        .select('id', { count: 'exact', head: true });

      // Build main query for fetching data
      let query = supabase
        .from('videos')
        .select(`
          *,
          categories (
            id,
            name,
            code
          ),
          clubs (
            id,
            name,
            short_name
          ),
          seasons (
            id,
            name,
            start_date,
            end_date
          )
        `)
        .order('created_at', { ascending: false });

      // Apply access control if enabled
      if (enableAccessControl && assignedCategories.length > 0) {
        query = query.in('category_id', assignedCategories);
        countQuery = countQuery.in('category_id', assignedCategories);
      } else if (enableAccessControl && assignedCategories.length === 0) {
        // If access control enabled but no categories assigned, show no videos
        setVideos([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      // Apply filters to both queries
      const applyFilters = (q: any) => {
        if (filters.category_id) {
          q = q.eq('category_id', filters.category_id);
        }
        if (filters.club_id) {
          q = q.eq('club_id', filters.club_id);
        }
        if (filters.season_id) {
          q = q.eq('season_id', filters.season_id);
        }
        if (filters.is_active !== undefined) {
          q = q.eq('is_active', filters.is_active);
        }
        if (filters.search) {
          q = q.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }
        return q;
      };

      query = applyFilters(query);
      countQuery = applyFilters(countQuery);

      // Add pagination to main query
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      // Execute both queries in parallel
      const [{ data, error }, { count, error: countError }] = await Promise.all([
        query,
        countQuery
      ]);

      if (error) {
        throw error;
      }

      if (countError) {
        console.warn('Error counting videos:', countError);
      }

      setVideos(data || []);
      setTotalCount(count || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(`Chyba při načítání videí: ${err instanceof Error ? err.message : 'Neznámá chyba'}`);
    } finally {
      setLoading(false);
    }
  }, [assignedCategories, enableAccessControl, itemsPerPage]);

  // Create video
  const createVideo = useCallback(async (formData: VideoFormData) => {
    try {
      const supabase = createClient();

      // Extract YouTube ID from URL
      const youtubeId = extractYouTubeId(formData.youtube_url);
      if (!youtubeId) {
        throw new Error('Neplatná YouTube URL');
      }

      const { data, error } = await supabase
        .from('videos')
        .insert({
          ...formData,
          youtube_id: youtubeId,
          thumbnail_url: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
          created_by: user?.id,
          updated_by: user?.id,
          // Convert empty strings to null for optional fields
          club_id: formData.club_id || null,
          season_id: formData.season_id || null,
          recording_date: formData.recording_date || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setVideos(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating video:', err);
      throw err;
    }
  }, [extractYouTubeId, user?.id]);

  // Update video
  const updateVideo = useCallback(async (id: string, formData: VideoFormData) => {
    try {
      const supabase = createClient();

      // Extract YouTube ID from URL
      const youtubeId = extractYouTubeId(formData.youtube_url);
      if (!youtubeId) {
        throw new Error('Neplatná YouTube URL');
      }

      const { data, error } = await supabase
        .from('videos')
        .update({
          ...formData,
          youtube_id: youtubeId,
          thumbnail_url: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
          updated_by: user?.id,
          // Convert empty strings to null for optional fields
          club_id: formData.club_id || null,
          season_id: formData.season_id || null,
          recording_date: formData.recording_date || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setVideos(prev => prev.map(video => video.id === id ? data : video));
      return data;
    } catch (err) {
      console.error('Error updating video:', err);
      throw err;
    }
  }, [extractYouTubeId, user?.id]);

  // Delete video
  const deleteVideo = useCallback(async (id: string) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setVideos(prev => prev.filter(video => video.id !== id));
    } catch (err) {
      console.error('Error deleting video:', err);
      throw err;
    }
  }, []);

  // Pagination functions
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return {
    videos,
    loading,
    error,
    setError,
    fetchVideos,
    createVideo,
    updateVideo,
    deleteVideo,
    extractYouTubeId,
    // Pagination
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    goToPage,
  };
}
