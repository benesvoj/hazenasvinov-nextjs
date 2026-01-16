import {NextRequest} from 'next/server';

import {errorResponse, successResponse, withAuth} from '@/utils/supabase/apiHelpers';

import {generateInsights, generateRecommendations} from '@/helpers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get('categoryId');
  const seasonId = searchParams.get('seasonId');
  const days = parseInt(searchParams.get('days') || '30');

  if (!categoryId || !seasonId) {
    return errorResponse('categoryId and seasonId are required', 400);
  }

  return withAuth(async (user, supabase) => {
    const [summaryResult, memberStatsResult, trendsResult] = await Promise.all([
      supabase
        .from('attendance_statistics_summary')
        .select('*')
        .eq('category_id', categoryId)
        .eq('season_id', seasonId)
        .single(),
      supabase.rpc('get_member_attendance_stats', {
        p_category_id: categoryId,
        p_season_id: seasonId,
      }),
      supabase.rpc('get_attendance_trends', {
        p_category_id: categoryId,
        p_season_id: seasonId,
        p_days: days,
      }),
    ]);

    if (summaryResult.error) throw summaryResult.error;
    if (memberStatsResult.error) throw memberStatsResult.error;
    if (trendsResult.error) throw trendsResult.error;

    const insights = generateInsights(memberStatsResult.data, trendsResult.data);

    const recommendations = generateRecommendations(memberStatsResult.data, summaryResult.data);

    return successResponse({
      summary: summaryResult.data,
      memberStats: memberStatsResult.data,
      trends: trendsResult.data,
      insights,
      recommendations,
      metadata: {
        generated_at: new Date().toISOString(),
        query_count: 3,
        cache_hint: 'stale-while-revalidate=300', // 5 minutes
      },
    });
  });
}
