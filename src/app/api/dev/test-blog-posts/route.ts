import {NextResponse} from 'next/server';

import {supabaseServerClient} from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await supabaseServerClient();

    // Test 1: Check if table exists
    const {data: tableCheck, error: tableError} = await supabase
      .from('blog_posts')
      .select('id')
      .limit(1);

    if (tableError) {
      return NextResponse.json(
        {
          error: 'Table access failed',
          details: tableError,
          message: tableError.message,
          code: tableError.code,
        },
        {status: 500}
      );
    }

    // Test 2: Check total count
    const {data: allPosts, error: countError} = await supabase.from('blog_posts').select('*');

    if (countError) {
      return NextResponse.json(
        {
          error: 'Count query failed',
          details: countError,
          message: countError.message,
          code: countError.code,
        },
        {status: 500}
      );
    }

    // Test 3: Check published posts only
    const {data: publishedPosts, error: publishedError} = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published');

    if (publishedError) {
      return NextResponse.json(
        {
          error: 'Published posts query failed',
          details: publishedError,
          message: publishedError.message,
          code: publishedError.code,
        },
        {status: 500}
      );
    }

    // Test 4: Check RLS policies
    const {data: rlsCheck, error: rlsError} = await supabase
      .from('blog_posts')
      .select('id, title, status')
      .eq('status', 'published')
      .limit(3);

    return NextResponse.json({
      success: true,
      table_exists: true,
      total_posts: allPosts?.length || 0,
      published_posts: publishedPosts?.length || 0,
      sample_published: rlsCheck || [],
      rls_working: !rlsError,
      debug_info: {
        all_posts_sample:
          allPosts?.slice(0, 3).map((p) => ({id: p.id, title: p.title, status: p.status})) || [],
        published_sample:
          publishedPosts?.slice(0, 3).map((p) => ({id: p.id, title: p.title, status: p.status})) ||
          [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Unexpected error',
        details: error,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500}
    );
  }
}
