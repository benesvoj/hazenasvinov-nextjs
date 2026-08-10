import {NextRequest} from 'next/server';

import {errorResponse, successResponse, withAdminAuth} from '@/utils/supabase/apiHelpers';

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

/**
 * POST /api/admin/refresh-materialized-view
 *
 * Refreshes a materialized view with the service role. The browser used to call
 * `refresh_materialized_view` — and `exec_sql` as a fallback — directly with the
 * user's session; both now grant EXECUTE to the backend only, because arbitrary
 * SQL reachable from any signed-in session was a full database compromise.
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(async (_user, _supabase, admin) => {
    const body = await request.json().catch(() => ({}));
    const viewName = body?.viewName;

    if (!REFRESHABLE_VIEWS.includes(viewName)) {
      return errorResponse(`Neznámý materializovaný pohled: ${viewName}`, 400);
    }

    const {error} = await admin.rpc('refresh_materialized_view', {view_name: viewName});

    if (error) {
      console.error('Error refreshing materialized view:', viewName, error);
      return errorResponse(error.message, 500);
    }

    return successResponse({viewName, refreshed: true});
  });
}
