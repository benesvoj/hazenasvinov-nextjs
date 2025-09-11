import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { BlogPost } from '@/types';

interface UseFetchBlogPostResult {
  post: BlogPost | null;
  relatedPosts: BlogPost[];
  loading: boolean;
  error: string | null;
}

export function useFetchBlogPost(slug: string): UseFetchBlogPostResult {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Fetch the specific post by slug
        const { data: postData, error: postError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (postError) {
          if (postError.code === 'PGRST116') {
            setError('Článek nebyl nalezen');
          } else {
            setError(`Chyba při načítání článku: ${postError.message}`);
          }
          return;
        }

        setPost(postData);

        // Fetch related posts based on category_id (since we removed tags)
        if (postData.category_id) {
          const { data: relatedData, error: relatedError } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('status', 'published')
            .eq('category_id', postData.category_id)
            .neq('id', postData.id)
            .order('published_at', { ascending: false, nullsLast: true })
            .order('created_at', { ascending: false })
            .limit(3);

          if (!relatedError && relatedData) {
            setRelatedPosts(relatedData);
          }
        }

      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError('Neočekávaná chyba při načítání článku');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  return {
    post,
    relatedPosts,
    loading,
    error
  };
}
