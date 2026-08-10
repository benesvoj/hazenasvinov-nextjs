import {NextRequest} from 'next/server';

import supabaseAdmin from '@/utils/supabase/admin';
import {errorResponse, successResponse, withAuth} from '@/utils/supabase/apiHelpers';
import {hasCoachRole, isAdmin} from '@/utils/supabase/coachAuth';

/**
 * Views this endpoint is allowed to refresh.
 *
 * The underlying `refresh_materialized_view(text)` function interpolates the
 * name into DDL, so the caller must never get to choose it freely.
 */
const REFRESHABLE_VIEWS = [
  'own_club_matches',
  'match_stats',
  'teams_with_details',
  'attendance_statistics_summary',
] as const;

type RefreshableView = (typeof REFRESHABLE_VIEWS)[number];

function isRefreshableView(value: unknown): value is RefreshableView {
  return REFRESHABLE_VIEWS.includes(value as RefreshableView);
}

/**
 * POST /api/admin/refresh-materialized-view
 *
 * Refreshes a materialized view with the service role. The browser used to call
 * `refresh_materialized_view` — and `exec_sql` as a fallback — directly with the
 * user's session; both now grant EXECUTE to the backend only, because arbitrary
 * SQL reachable from any signed-in session was a full database compromise.
 *
 * Open to admins and coaches: coaches enter match results too, and their save
 * path has to refresh `own_club_matches` the same way the admin one does.
 */
export async function POST(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const [admin, coach] = await Promise.all([
      isAdmin(supabase, user.id),
      hasCoachRole(supabase, user.id),
    ]);

    if (!admin && !coach) {
      return errorResponse('Forbidden', 403);
    }

    const body = await request.json().catch(() => ({}));
    const viewName = body?.viewName;

    if (!isRefreshableView(viewName)) {
      return errorResponse(`Neznámý materializovaný pohled: ${viewName}`, 400);
    }

    const {error} = await supabaseAdmin.rpc('refresh_materialized_view', {view_name: viewName});

    if (error) {
      console.error('Error refreshing materialized view:', viewName, error);
      return errorResponse(error.message, 500);
    }

    return successResponse({viewName, refreshed: true});
  });
}
