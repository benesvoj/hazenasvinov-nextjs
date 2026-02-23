import {withClientQueryList} from '@/utils/supabase/queryHelpers';

import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {DB_TABLE, ENTITY} from '@/queries/blogPosts/constants';
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {Blog} from '@/types';
import {supabaseBrowserClient} from '@/utils';

export async function getAllBlogPosts(
  ctx: QueryContext,
  options?: GetEntitiesOptions
): Promise<QueryResult<Blog[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
      sorting: options?.sorting,
      pagination: options?.pagination,
      filters: options?.filters,
    });

    const {data, error, count} = await query;

    // Handle malformed Supabase error (bug when pagination is beyond available records)
    const paginationBugResult = handleSupabasePaginationBug<Blog>(error, count);
    if (paginationBugResult) {
      return paginationBugResult;
    }

    return {
      data: data as unknown as Blog[],
      error: null,
      count: count ?? 0,
    };
  } catch (err: any) {
    console.error(`Exception in getAll${ENTITY.plural}`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
      count: 0,
    };
  }
}

export async function getBlogPostById(ctx: QueryContext, id: string): Promise<QueryResult<Blog>> {
  try {
    const query = buildSelectOneQuery(ctx.supabase, DB_TABLE, id);

    const {data, error} = await query;

    if (error) {
      console.error(`Error fetching ${ENTITY.singular}`, error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as unknown as Blog,
      error: null,
    };
  } catch (err: any) {
    console.error(`Exception in get${ENTITY.singular}ById:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

/**
 * Client-side fetch: Get all published blog posts
 * Use with useQuery or prefetchQuery
 */
export const fetchBlogPosts = withClientQueryList<Blog>((supabase) =>
  supabase
    .from(DB_TABLE)
    .select('*')
    .eq('status', 'published')
    .order('published_at', {ascending: false})
    .order('created_at', {ascending: false})
);

/**
 * Client-side fetch: Get blog post by slug with related data
 * Use with useQuery or prefetchQuery in Server Components
 */
export async function fetchBlogPostBySlug(slug: string) {
  const supabase = supabaseBrowserClient();

  // Fetch blog post
  const {data: post, error: postError} = await supabase
    .from(DB_TABLE)
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (postError) throw postError;
  if (!post) throw new Error('Blog post not found');

  // Fetch related data in parallel
  const [{data: categories}, {data: relatedPosts}] = await Promise.all([
    supabase.from('categories').select('*'),

    post.category_id
      ? supabase
          .from(DB_TABLE)
          .select('*')
          .eq('status', 'published')
          .eq('category_id', post.category_id)
          .neq('slug', slug)
          .order('published_at', {ascending: false})
          .limit(2)
      : Promise.resolve({data: []}),
  ]);

  const category = categories?.find((c: any) => c.id === post.category_id);

  return {
    post,
    relatedPosts: relatedPosts || [],
    category,
  };
}

/**
 * Client-side fetch: Get match data for blog post
 * Use when blog post has match_id
 */
export async function fetchBlogPostMatch(matchId: string) {
  const supabase = supabaseBrowserClient();

  const {data: matchData, error} = await supabase
    .from('matches')
    .select(
      `
      *,
      home_team:home_team_id(
        id,
        team_suffix,
        club_category:club_categories(
          club:clubs(id, name, short_name, logo_url, is_own_club)
        )
      ),
      away_team:away_team_id(
        id,
        team_suffix,
        club_category:club_categories(
          club:clubs(id, name, short_name, logo_url, is_own_club)
        )
      ),
      category:categories(id, name),
      season:seasons(id, name)
    `
    )
    .eq('id', matchId)
    .single();

  if (error) throw error;
  return matchData;
}
