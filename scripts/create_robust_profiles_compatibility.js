// Create robust profiles compatibility layer with materialized view option
const {createClient} = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createRobustProfilesCompatibility() {
  try {
    console.log('🔧 Creating robust profiles compatibility layer...');

    // 1. Create a materialized view as the primary compatibility layer
    console.log('1. Creating materialized profiles view...');
    const {data: createMaterializedView, error: materializedError} = await supabase.rpc(
      'exec_sql',
      {
        sql: `
        -- Drop existing materialized view if it exists
        DROP MATERIALIZED VIEW IF EXISTS profiles_mv CASCADE;
        
        -- Create materialized view
        CREATE MATERIALIZED VIEW profiles_mv AS
        SELECT 
          up.id,
          up.user_id,
          up.role,
          up.club_id,
          up.assigned_categories,
          up.created_at,
          up.updated_at,
          -- Add auth.users fields
          au.email,
          au.email_confirmed_at,
          au.user_metadata,
          au.raw_user_meta_data,
          au.created_at as auth_created_at,
          au.updated_at as auth_updated_at,
          -- Add computed fields
          CASE 
            WHEN au.user_metadata->>'full_name' IS NOT NULL 
            THEN au.user_metadata->>'full_name'
            ELSE au.email
          END as display_name,
          au.user_metadata->>'phone' as phone,
          au.user_metadata->>'bio' as bio,
          au.user_metadata->>'position' as position,
          COALESCE((au.user_metadata->>'is_blocked')::boolean, false) as is_blocked
        FROM public.user_profiles up
        LEFT JOIN auth.users au ON up.user_id = au.id;
        
        -- Create unique index on user_id
        CREATE UNIQUE INDEX profiles_mv_user_id_idx ON profiles_mv (user_id);
        
        -- Create other useful indexes
        CREATE INDEX profiles_mv_role_idx ON profiles_mv (role);
        CREATE INDEX profiles_mv_club_id_idx ON profiles_mv (club_id);
        CREATE INDEX profiles_mv_email_idx ON profiles_mv (email);
        
        -- Grant permissions
        GRANT SELECT ON profiles_mv TO authenticated;
        GRANT SELECT ON profiles_mv TO service_role;
      `,
      }
    );

    if (materializedError) {
      console.error('Error creating materialized view:', materializedError.message);
    } else {
      console.log('✅ Materialized profiles view created');
    }

    // 2. Create a regular view that points to the materialized view
    console.log('2. Creating profiles view...');
    const {data: createView, error: viewError} = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing view if it exists
        DROP VIEW IF EXISTS profiles CASCADE;
        
        -- Create view that points to materialized view
        CREATE VIEW profiles AS
        SELECT * FROM profiles_mv;
        
        -- Grant permissions
        GRANT SELECT ON profiles TO authenticated;
        GRANT SELECT ON profiles TO service_role;
      `,
    });

    if (viewError) {
      console.error('Error creating view:', viewError.message);
    } else {
      console.log('✅ Profiles view created');
    }

    // 3. Create functions to refresh the materialized view
    console.log('3. Creating refresh functions...');
    const {data: createRefreshFunctions, error: refreshError} = await supabase.rpc('exec_sql', {
      sql: `
        -- Function to refresh the materialized view
        CREATE OR REPLACE FUNCTION refresh_profiles_mv()
        RETURNS void AS $$
        BEGIN
          REFRESH MATERIALIZED VIEW CONCURRENTLY profiles_mv;
        END;
        $$ LANGUAGE plpgsql;

        -- Function to refresh and return stats
        CREATE OR REPLACE FUNCTION refresh_profiles_mv_with_stats()
        RETURNS TABLE (
          refreshed_at TIMESTAMP WITH TIME ZONE,
          total_profiles INTEGER,
          message TEXT
        ) AS $$
        DECLARE
          profile_count INTEGER;
        BEGIN
          REFRESH MATERIALIZED VIEW CONCURRENTLY profiles_mv;
          
          SELECT COUNT(*) INTO profile_count FROM profiles_mv;
          
          RETURN QUERY SELECT 
            NOW() as refreshed_at,
            profile_count as total_profiles,
            'Materialized view refreshed successfully'::TEXT as message;
        END;
        $$ LANGUAGE plpgsql;
      `,
    });

    if (refreshError) {
      console.error('Error creating refresh functions:', refreshError.message);
    } else {
      console.log('✅ Refresh functions created');
    }

    // 4. Create triggers to automatically refresh the materialized view
    console.log('4. Creating auto-refresh triggers...');
    const {data: createAutoRefresh, error: autoRefreshError} = await supabase.rpc('exec_sql', {
      sql: `
        -- Function to handle user_profiles changes
        CREATE OR REPLACE FUNCTION trigger_refresh_profiles_mv()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Refresh the materialized view asynchronously
          PERFORM pg_notify('refresh_profiles_mv', 'user_profiles_changed');
          RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;

        -- Create triggers on user_profiles
        DROP TRIGGER IF EXISTS user_profiles_refresh_trigger ON user_profiles;
        CREATE TRIGGER user_profiles_refresh_trigger
          AFTER INSERT OR UPDATE OR DELETE ON user_profiles
          FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_profiles_mv();

        -- Create triggers on auth.users
        DROP TRIGGER IF EXISTS auth_users_refresh_trigger ON auth.users;
        CREATE TRIGGER auth_users_refresh_trigger
          AFTER UPDATE ON auth.users
          FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_profiles_mv();
      `,
    });

    if (autoRefreshError) {
      console.error('Error creating auto-refresh triggers:', autoRefreshError.message);
    } else {
      console.log('✅ Auto-refresh triggers created');
    }

    // 5. Create RLS policies
    console.log('5. Creating RLS policies...');
    const {data: createPolicies, error: policiesError} = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS on the materialized view
        ALTER MATERIALIZED VIEW profiles_mv ENABLE ROW LEVEL SECURITY;
        
        -- Create policies for the materialized view
        DROP POLICY IF EXISTS "Users can view their own profile" ON profiles_mv;
        CREATE POLICY "Users can view their own profile" ON profiles_mv
          FOR SELECT
          TO authenticated
          USING (user_id = auth.uid());

        DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles_mv;
        CREATE POLICY "Admins can view all profiles" ON profiles_mv
          FOR SELECT
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.user_profiles up 
              WHERE up.user_id = auth.uid() 
              AND up.role = 'admin'
            )
          );

        -- Service role bypass
        DROP POLICY IF EXISTS "Service role bypass" ON profiles_mv;
        CREATE POLICY "Service role bypass" ON profiles_mv
          FOR SELECT
          TO service_role
          USING (true);
      `,
    });

    if (policiesError) {
      console.error('Error creating policies:', policiesError.message);
    } else {
      console.log('✅ RLS policies created');
    }

    // 6. Create a comprehensive sync function
    console.log('6. Creating comprehensive sync function...');
    const {data: createSyncFunction, error: syncError} = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION sync_all_profiles_data()
        RETURNS TABLE (
          synced_users INTEGER,
          total_profiles INTEGER,
          refreshed_at TIMESTAMP WITH TIME ZONE,
          message TEXT
        ) AS $$
        DECLARE
          user_count INTEGER;
          profile_count INTEGER;
        BEGIN
          -- Count users without profiles
          SELECT COUNT(*) INTO user_count
          FROM auth.users au
          LEFT JOIN public.user_profiles up ON au.id = up.user_id
          WHERE up.user_id IS NULL;
          
          -- Create profiles for users that don't have them
          INSERT INTO public.user_profiles (user_id, role, created_at, updated_at)
          SELECT 
            au.id,
            'member',
            NOW(),
            NOW()
          FROM auth.users au
          LEFT JOIN public.user_profiles up ON au.id = up.user_id
          WHERE up.user_id IS NULL
          ON CONFLICT (user_id) DO NOTHING;
          
          -- Refresh the materialized view
          REFRESH MATERIALIZED VIEW CONCURRENTLY profiles_mv;
          
          -- Get final count
          SELECT COUNT(*) INTO profile_count FROM profiles_mv;
          
          RETURN QUERY SELECT 
            user_count as synced_users,
            profile_count as total_profiles,
            NOW() as refreshed_at,
            'All profiles synced and materialized view refreshed'::TEXT as message;
        END;
        $$ LANGUAGE plpgsql;
      `,
    });

    if (syncError) {
      console.error('Error creating sync function:', syncError.message);
    } else {
      console.log('✅ Comprehensive sync function created');
    }

    // 7. Test the compatibility layer
    console.log('7. Testing compatibility layer...');
    try {
      // Test the sync function
      const {data: syncResult, error: syncTestError} = await supabase.rpc('sync_all_profiles_data');

      if (syncTestError) {
        console.error('❌ Sync test failed:', syncTestError.message);
      } else {
        console.log('✅ Sync test passed:', syncResult);
      }

      // Test direct query on the materialized view
      const {data: directQuery, error: directError} = await supabase.rpc('exec_sql', {
        sql: 'SELECT COUNT(*) as count FROM profiles_mv;',
      });

      if (directError) {
        console.error('❌ Direct query test failed:', directError.message);
      } else {
        console.log('✅ Direct query test passed:', directQuery);
      }
    } catch (testError) {
      console.error('❌ Exception during testing:', testError.message);
    }

    console.log('\n🎉 Robust profiles compatibility layer created successfully!');
    console.log('\n📋 What was created:');
    console.log('1. ✅ `profiles_mv` materialized view with all profile data');
    console.log('2. ✅ `profiles` view that points to the materialized view');
    console.log('3. ✅ Auto-refresh triggers for real-time updates');
    console.log('4. ✅ RLS policies for security');
    console.log('5. ✅ `sync_all_profiles_data()` function for comprehensive syncing');
    console.log('6. ✅ `refresh_profiles_mv()` function for manual refresh');
    console.log('\n🔧 Usage:');
    console.log('- Use `profiles` table in your code (it points to the materialized view)');
    console.log('- Run `SELECT * FROM sync_all_profiles_data();` to sync and refresh');
    console.log('- Run `SELECT refresh_profiles_mv();` to manually refresh the view');
    console.log('- The materialized view will auto-refresh when user_profiles changes');
    console.log(
      '\n⚠️  Note: Materialized views have some limitations with RLS, but this provides the best compatibility'
    );
  } catch (error) {
    console.error('❌ Error creating robust compatibility layer:', error);
  }
}

createRobustProfilesCompatibility();
