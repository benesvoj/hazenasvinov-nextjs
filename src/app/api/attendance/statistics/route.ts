import {NextRequest} from 'next/server';

import {errorResponse, successResponse, withAuth} from '@/utils/supabase/apiHelpers';
import {hasCategoryAccess, isAdmin} from '@/utils/supabase/coachAuth';

import {
  generateInsights,
  generateRecommendations,
  selectActionableMemberStats,
} from '@/helpers/attendance/helpers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get('categoryId');
  const seasonId = searchParams.get('seasonId');
  const days = parseInt(searchParams.get('days') || '30');

  if (!categoryId || !seasonId) {
    return errorResponse('categoryId and seasonId are required', 400);
  }

  return withAuth(async (user, supabase) => {
    const adminUser = await isAdmin(supabase, user.id);
    if (!adminUser) {
      const allowed = await hasCategoryAccess(supabase, user.id, categoryId);
      if (!allowed) return errorResponse('Forbidden', 403);
    }
    const [summaryResult, memberStatsResult, trendsResult] = await Promise.all([
      supabase
        .from('attendance_statistics_summary')
        .select('*')
        .eq('category_id', categoryId)
        .eq('season_id', seasonId)
        .maybeSingle(),
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

    // The stats keep deactivated members that still have records, so their
    // history stays readable. Insights and recommendations point forward
    // instead — "contact this member", "watch this member" — so they are built
    // from the members still in the squad only.
    const memberStats = memberStatsResult.data ?? [];
    const memberIds = memberStats.map((stat: {member_id: string}) => stat.member_id);

    let actionableMemberStats = memberStats;
    if (memberIds.length > 0) {
      const {data: activeMembers, error: activeMembersError} = await supabase
        .from('members')
        .select('id')
        .in('id', memberIds)
        .eq('is_active', true);

      if (activeMembersError) throw activeMembersError;

      actionableMemberStats = selectActionableMemberStats(
        memberStats,
        (activeMembers ?? []).map((member) => member.id)
      );
    }

    const insights = generateInsights(actionableMemberStats, trendsResult.data);

    const recommendations = generateRecommendations(actionableMemberStats, summaryResult.data);

    return successResponse({
      summary: summaryResult.data,
      // Full history, deactivated members included.
      memberStats,
      trends: trendsResult.data,
      insights,
      recommendations,
      metadata: {
        generated_at: new Date().toISOString(),
        query_count: 4,
        cache_hint: 'stale-while-revalidate=300', // 5 minutes
      },
    });
  });
}
