import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { BlogPost } from '@/types';

export const useFetchBlogPosts = (limit: number = 3) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Fetch only published posts, ordered by created date (newest first)
      const { data, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) {
        console.error('Error fetching blog posts:', fetchError);
        
        // Handle specific errors
        if (fetchError.code === 'PGRST116') {
          setError('Žádné články nebyly nalezeny');
        } else if (fetchError.message.includes('relation "blog_posts" does not exist')) {
          setError('Blog systém není ještě nastaven');
        } else {
          setError(`Chyba při načítání článků: ${fetchError.message}`);
        }
        
        setPosts([]);
        return;
      }

      // Transform the data to match the expected format
      let transformedPosts = (data || []).map((post: any) => ({
        ...post,
        // Ensure we have fallback values
        excerpt: post.excerpt || post.content?.substring(0, 150) + '...' || 'Bez popisu',
        tags: post.tags || [],
        image_url: post.image_url || null
      }));

      // Debug: Log the ordering information
      // console.log('Blog posts fetched with ordering:', transformedPosts.map((post: any) => ({
      //   id: post.id,
      //   title: post.title,
      //   created_at: post.created_at,
      //   status: post.status
      // })));

      setPosts(transformedPosts);
      
    } catch (err) {
      console.error('Unexpected error fetching blog posts:', err);
      setError('Neočekávaná chyba při načítání článků');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const refreshPosts = () => {
    fetchPosts();
  };

  return {
    posts,
    loading,
    error,
    refreshPosts
  };
};
