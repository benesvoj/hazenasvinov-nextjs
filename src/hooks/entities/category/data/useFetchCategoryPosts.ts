import {useState, useEffect, useCallback} from 'react';
import {createClient} from '@/utils/supabase/client';

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
  category_id?: string;
}

// TODO: blog_posts table does not have category_id column, so we need to filter by tags that contain the category name. improve it
export const useFetchCategoryPosts = (categorySlug: string, limit: number = 3) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // First, try to get the category ID from the category slug
      const {data: categoryData, error: categoryError} = await supabase
        .from('categories')
        .select('id, name, code')
        .eq('code', categorySlug)
        .single();

      if (categoryError) {
        setError('Kategorie nebyla nalezena');
        setPosts([]);
        return;
      }

      const categoryId = categoryData.id;
      const categoryName = categoryData.name;

      // First try to fetch posts by category_id
      let {data, error: fetchError} = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .eq('category_id', categoryId)
        .order('created_at', {ascending: false})
        .limit(limit);

      // Posts are filtered by category_id at the database level

      if (fetchError) {
        // Handle specific errors
        if (fetchError.code === 'PGRST116') {
          setError('Žádné články nebyly nalezeny pro tuto kategorii');
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
        image_url: post.image_url || null,
      }));

      setPosts(transformedPosts);
    } catch (err) {
      setError('Neočekávaná chyba při načítání článků');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [categorySlug, limit]);

  useEffect(() => {
    if (categorySlug) {
      fetchPosts();
    }
  }, [fetchPosts, categorySlug]);

  const refreshPosts = () => {
    fetchPosts();
  };

  return {
    posts,
    loading,
    error,
    refreshPosts,
  };
};
