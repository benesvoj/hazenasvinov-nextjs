import {supabaseBrowserClient} from '@/utils/supabase/client';

import {refreshOwnClubMatchesView} from './refreshMaterializedView';

/**
 * Debug helper wired to the "Test materialized view refresh" admin action.
 *
 * Refreshes through the admin API route and then reads both the view and its
 * source table so the two can be compared in the console. It used to probe
 * `pg_proc` and call `refresh_materialized_view` / `exec_sql` over RPC straight
 * from the browser; those functions no longer grant EXECUTE to `authenticated`,
 * so all of it did was log failures.
 */
export async function testMaterializedViewRefresh() {
  const supabase = supabaseBrowserClient();

  console.log('🔍 Testing materialized view refresh...');

  try {
    console.log('1. Refreshing own_club_matches via admin API...');
    const refreshed = await refreshOwnClubMatchesView();

    if (refreshed) {
      console.log('✅ Refresh succeeded');
    } else {
      console.error('❌ Refresh failed — see the warning above for the reason');
    }

    console.log('2. Checking current materialized view data...');
    const {data: viewData, error: viewError} = await supabase
      .from('own_club_matches')
      .select('id, status, home_score, away_score, updated_at')
      .limit(5);

    if (viewError) {
      console.error('❌ Error querying materialized view:', viewError);
    } else {
      console.log('✅ Materialized view data:', viewData);
    }

    console.log('3. Checking source matches table...');
    const {data: matchesData, error: matchesError} = await supabase
      .from('matches')
      .select('id, status, home_score, away_score, updated_at')
      .limit(5);

    if (matchesError) {
      console.error('❌ Error querying matches table:', matchesError);
    } else {
      console.log('✅ Matches table data:', matchesData);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}
