import {supabaseBrowserClient} from '@/utils/supabase/client';

/**
 * Centralized function to refresh the own_club_matches materialized view
 * This ensures all match operations use the same refresh logic
 */
export async function refreshOwnClubMatchesView(): Promise<boolean> {
  const supabase = supabaseBrowserClient();

  // console.log('Refreshing own_club_matches materialized view...');

  try {
    // First try RPC function
    // console.log('Attempting RPC refresh...');
    const {error: rpcError} = await supabase.rpc('refresh_materialized_view', {
      view_name: 'own_club_matches',
    });

    if (!rpcError) {
      // console.log('✅ Materialized view refreshed successfully via RPC');
      return true;
    }

    console.warn('RPC refresh failed, trying exec_sql approach:', rpcError);

    // Fallback: Use exec_sql to run REFRESH MATERIALIZED VIEW directly
    const {error: sqlError} = await supabase.rpc('exec_sql', {
      sql: 'REFRESH MATERIALIZED VIEW own_club_matches;',
    });

    if (!sqlError) {
      // console.log('✅ Materialized view refreshed successfully via exec_sql');
      return true;
    }

    console.warn('exec_sql refresh also failed:', sqlError);

    // Last resort: Try to force refresh by querying the view
    // This doesn't actually refresh but can help with some caching issues
    // console.log('Trying fallback query approach...');
    await supabase.from('own_club_matches').select('id').limit(1);

    // console.log('⚠️ Materialized view refresh attempted via fallback method');
    return false; // Indicate fallback was used
  } catch (error) {
    console.error('❌ Materialized view refresh failed with error:', error);
    return false; // Indicate failure
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
