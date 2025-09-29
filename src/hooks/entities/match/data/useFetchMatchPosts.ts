import {useState, useEffect} from 'react';

import {createClient} from '@/utils/supabase/client';

import {BlogPost} from '@/types';

interface UseFetchMatchPostsResult {
  posts: BlogPost[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch blog posts related to a match
 * @param matchId - The ID of the match
 * @returns Array of blog posts, loading state, and error state
 */
export function useFetchMatchPosts(matchId: string | null): UseFetchMatchPostsResult {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) {
      setPosts([]);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Fetch blog posts related to this match
        const {data: postsData, error: postsError} = await supabase
          .from('blog_posts')
          .select('*')
          .eq('match_id', matchId)
          .eq('status', 'published')
          .order('published_at', {ascending: false, nullsLast: true})
          .order('created_at', {ascending: false});

        if (postsError) {
          throw postsError;
        }

        setPosts(postsData || []);
      } catch (err) {
        console.error('Error fetching match posts:', err);
        setError(err instanceof Error ? err.message : 'Chyba při načítání článků');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [matchId]);

  return {
    posts,
    loading,
    error,
  };
}
