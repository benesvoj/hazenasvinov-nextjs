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
      const { data: categoryData, error: categoryError } = await supabase
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
      let { data, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false })
        .limit(limit);

      // If no posts found by category_id, try to match by tags as fallback
      if (!fetchError && (!data || data.length === 0)) {
        
        // Create a mapping of category codes to tag patterns
        const categoryTagMap: { [key: string]: string[] } = {
          'men': ['muži', 'mužský', 'dospělí', 'muž', 'mužů', 'mužská', 'mužské', 'mužský tým', 'mužský oddíl', 'muži', 'muž', 'dospělí', 'senior', 'senioři'],
          'women': ['ženy', 'ženský', 'dospělé', 'žena', 'ženská', 'ženské', 'ženský tým', 'ženský oddíl', 'ženy', 'žena', 'dospělé', 'seniorky', 'seniorky'],
          'youngerBoys': ['mladší žáci', 'mladší', 'žáci', 'mladší žák', 'dorostenci', 'dorostenec', 'žáci', 'mladší', 'dorostenci'],
          'youngerGirls': ['mladší žačky', 'mladší', 'žačky', 'mladší žačka', 'dorostenky', 'dorostenka', 'žačky', 'mladší', 'dorostenky'],
          'olderBoys': ['starší žáci', 'starší', 'žáci', 'starší žák', 'junioři', 'junior', 'žáci', 'starší', 'junioři'],
          'olderGirls': ['starší žačky', 'starší', 'žačky', 'starší žačka', 'juniorky', 'juniorka', 'žačky', 'starší', 'juniorky'],
          'prepKids': ['přípravka', 'přípravky', 'děti', 'dítě', 'přípravka', 'přípravka', 'přípravka', 'děti', 'přípravka']
        };

        const tagPatterns = categoryTagMap[categorySlug] || [];
        
        if (tagPatterns.length > 0) {
          // Try to find posts that match any of the tag patterns using overlaps operator
          const { data: tagData, error: tagError } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('status', 'published')
            .overlaps('tags', tagPatterns)
            .order('created_at', { ascending: false })
            .limit(limit);

          if (!tagError && tagData && tagData.length > 0) {
            data = tagData;
            fetchError = null;
          } else {
            // If still no posts found, try a more flexible approach
            const { data: allPosts, error: allPostsError } = await supabase
              .from('blog_posts')
              .select('id, title, tags, category_id')
              .eq('status', 'published')
              .limit(10);

            // If we have posts but no category-specific matches, try a more flexible approach
            if (allPosts && allPosts.length > 0) {
              // Try to match posts by checking if any tag contains any of our patterns (case insensitive)
              const flexibleMatches = allPosts.filter((post: any) => {
                if (!post.tags || !Array.isArray(post.tags)) return false;
                
                return post.tags.some((tag: string) => 
                  tagPatterns.some(pattern => 
                    tag.toLowerCase().includes(pattern.toLowerCase()) || 
                    pattern.toLowerCase().includes(tag.toLowerCase())
                  )
                );
              });

              if (flexibleMatches.length > 0) {
                // Get full post data for the matches
                const { data: fullMatches, error: fullMatchesError } = await supabase
                  .from('blog_posts')
                  .select('*')
                  .eq('status', 'published')
                  .in('id', flexibleMatches.map((p: any) => p.id))
                  .order('created_at', { ascending: false })
                  .limit(limit);
                
                if (!fullMatchesError && fullMatches) {
                  data = fullMatches;
                  fetchError = null;
                }
              } else {
                // Last resort: show all published posts if no category-specific posts found
                const { data: fallbackPosts, error: fallbackError } = await supabase
                  .from('blog_posts')
                  .select('*')
                  .eq('status', 'published')
                  .order('created_at', { ascending: false })
                  .limit(limit);
                
                if (!fallbackError && fallbackPosts) {
                  data = fallbackPosts;
                  fetchError = null;
                }
              }
            }
          }
        }
      }

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
        image_url: post.image_url || null
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
    refreshPosts
  };
};
