import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_id: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  image_url?: string;
}

export const useFetchBlogPosts = (limit: number = 3) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Fetch only published posts, ordered by published date (or created date if not published)
      const { data, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsLast: true })
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
      let transformedPosts = (data || []).map(post => ({
        ...post,
        // Ensure we have fallback values
        excerpt: post.excerpt || post.content?.substring(0, 150) + '...' || 'Bez popisu',
        tags: post.tags || [],
        image_url: post.image_url || null
      }));

      // Additional sorting to ensure newest posts are first
      transformedPosts.sort((a, b) => {
        // First priority: published_at (newest first)
        const aPublished = a.published_at ? new Date(a.published_at).getTime() : 0;
        const bPublished = b.published_at ? new Date(b.published_at).getTime() : 0;
        
        if (aPublished !== bPublished) {
          return bPublished - aPublished; // Newest first
        }
        
        // Second priority: created_at (newest first)
        const aCreated = new Date(a.created_at).getTime();
        const bCreated = new Date(b.created_at).getTime();
        return bCreated - aCreated; // Newest first
      });

      // Debug: Log the ordering information
      console.log('Blog posts fetched with ordering:', transformedPosts.map(post => ({
        id: post.id,
        title: post.title,
        published_at: post.published_at,
        created_at: post.created_at,
        status: post.status
      })));

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
