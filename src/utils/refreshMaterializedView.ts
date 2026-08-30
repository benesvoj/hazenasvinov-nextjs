import {API_ROUTES} from '@/lib/api-routes';

/**
 * Refreshes the own_club_matches materialized view.
 *
 * Goes through an admin API route that holds the service role. The browser used
 * to call `refresh_materialized_view` — falling back to `exec_sql` with a raw
 * REFRESH statement — using the signed-in user's session. Both lost EXECUTE for
 * `authenticated` first, because arbitrary SQL reachable from any session meant
 * anyone signed in could rewrite the database; `exec_sql` was then dropped
 * outright on 2026-08-30.
 *
 * @returns whether the view was actually refreshed. Callers treat `false` as a
 *          soft failure: the data is stale, not wrong.
 */
export async function refreshOwnClubMatchesView(): Promise<boolean> {
  try {
    const response = await fetch(API_ROUTES.admin.refreshMaterializedView, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({viewName: 'own_club_matches'}),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      console.warn('Materialized view refresh failed:', result?.error ?? response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Materialized view refresh failed with error:', error);
    return false;
  }
}

/**
 * Refresh materialized view with error handling and optional callback
 * @param operationName - Name of the operation for logging
 * @param onSuccess - Optional callback to run on successful refresh
 * @param onError - Optional callback to run on refresh failure
 */
export async function refreshMaterializedViewWithCallback(
  operationName: string,
  onSuccess?: () => void,
  onError?: (error: any) => void
): Promise<void> {
  // console.log(`Refreshing materialized view after ${operationName}...`);

  const success = await refreshOwnClubMatchesView();

  if (success) {
    onSuccess?.();
  } else {
    onError?.(new Error('Materialized view refresh failed'));
  }
}
