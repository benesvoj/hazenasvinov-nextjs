import {supabaseBrowserClient} from '@/utils/supabase/client';

/**
 * Test function to debug materialized view refresh issues
 */
export async function testMaterializedViewRefresh() {
  const supabase = supabaseBrowserClient();

  console.log('🔍 Testing materialized view refresh...');

  try {
    // First, check if the RPC function exists
    console.log('1. Checking if refresh_materialized_view function exists...');
    const {data: functions, error: functionsError} = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'refresh_materialized_view');

    if (functionsError) {
      console.error('❌ Error checking functions:', functionsError);
    } else {
      console.log('✅ Functions found:', functions);
    }

    // Try to call the RPC function
    console.log('2. Attempting to call refresh_materialized_view RPC...');
    const {data: rpcData, error: rpcError} = await supabase.rpc('refresh_materialized_view', {
      view_name: 'own_club_matches',
    });

    if (rpcError) {
      console.error('❌ RPC call failed:', rpcError);

      // Try alternative approach - direct SQL execution
      console.log('3. Trying alternative approach with exec_sql...');
      const {data: sqlData, error: sqlError} = await supabase.rpc('exec_sql', {
        sql: 'REFRESH MATERIALIZED VIEW own_club_matches;',
      });

      if (sqlError) {
        console.error('❌ SQL execution failed:', sqlError);
      } else {
        console.log('✅ SQL execution succeeded:', sqlData);
      }
    } else {
      console.log('✅ RPC call succeeded:', rpcData);
    }

    // Check the current state of the materialized view
    console.log('4. Checking current materialized view data...');
    const {data: viewData, error: viewError} = await supabase
      .from('own_club_matches')
      .select('id, status, home_score, away_score, updated_at')
      .limit(5);

    if (viewError) {
      console.error('❌ Error querying materialized view:', viewError);
    } else {
      console.log('✅ Materialized view data:', viewData);
    }

    // Check the source matches table
    console.log('5. Checking source matches table...');
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
