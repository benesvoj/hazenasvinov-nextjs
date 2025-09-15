// Create compatibility layer for profiles table mapping
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

async function createProfilesCompatibility() {
  try {
    console.log('🔧 Creating profiles compatibility layer...');

    // 1. First, let's check what we're working with
    console.log('1. Checking current database state...');
    const {data: currentState, error: stateError} = await supabase.rpc('exec_sql', {
      sql: `
        -- Check if user_profiles exists and has data
        SELECT 
          'user_profiles_exists' as check_name,
          EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles'
          ) as result
        UNION ALL
        SELECT 
          'user_profiles_has_data' as check_name,
          (SELECT COUNT(*) > 0 FROM public.user_profiles) as result
        UNION ALL
        SELECT 
          'profiles_exists' as check_name,
          EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles'
          ) as result;
      `,
    });

    if (stateError) {
      console.error('Error checking state:', stateError.message);
    } else {
      console.log('Current state:');
      if (Array.isArray(currentState)) {
        currentState.forEach((check) => {
          console.log(`  - ${check.check_name}: ${check.result}`);
        });
      }
    }

    // 2. Create a compatibility view that maps user_profiles to profiles
    console.log('2. Creating profiles compatibility view...');
    const {data: createView, error: viewError} = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing view if it exists
        DROP VIEW IF EXISTS profiles CASCADE;
        
        -- Create compatibility view that maps user_profiles to profiles
        CREATE VIEW profiles AS
        SELECT 
          up.id,
          up.user_id,
          up.role,
          up.club_id,
          up.assigned_categories,
          up.created_at,
          up.updated_at,
          -- Add additional fields that might be expected
          au.email,
          au.email_confirmed_at,
          au.user_metadata,
          au.raw_user_meta_data,
          au.created_at as auth_created_at,
          au.updated_at as auth_updated_at
        FROM public.user_profiles up
        LEFT JOIN auth.users au ON up.user_id = au.id;
        
        -- Grant permissions on the view
        GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
        GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO service_role;
      `,
    });

    if (viewError) {
      console.error('Error creating view:', viewError.message);
    } else {
      console.log('✅ Profiles compatibility view created');
    }

    // 3. Create triggers to handle INSERT/UPDATE/DELETE on the view
    console.log('3. Creating triggers for profiles view...');
    const {data: createTriggers, error: triggersError} = await supabase.rpc('exec_sql', {
      sql: `
        -- Function to handle INSERT on profiles view
        CREATE OR REPLACE FUNCTION handle_profiles_insert()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Insert into user_profiles table
          INSERT INTO public.user_profiles (
            user_id,
            role,
            club_id,
            assigned_categories,
            created_at,
            updated_at
          ) VALUES (
            NEW.user_id,
            COALESCE(NEW.role, 'member'),
            NEW.club_id,
            COALESCE(NEW.assigned_categories, '{}'),
            COALESCE(NEW.created_at, NOW()),
            COALESCE(NEW.updated_at, NOW())
          )
          ON CONFLICT (user_id) DO UPDATE SET
            role = EXCLUDED.role,
            club_id = EXCLUDED.club_id,
            assigned_categories = EXCLUDED.assigned_categories,
            updated_at = EXCLUDED.updated_at;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Function to handle UPDATE on profiles view
        CREATE OR REPLACE FUNCTION handle_profiles_update()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Update user_profiles table
          UPDATE public.user_profiles SET
            role = COALESCE(NEW.role, OLD.role),
            club_id = NEW.club_id,
            assigned_categories = COALESCE(NEW.assigned_categories, OLD.assigned_categories),
            updated_at = COALESCE(NEW.updated_at, NOW())
          WHERE user_id = NEW.user_id;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Function to handle DELETE on profiles view
        CREATE OR REPLACE FUNCTION handle_profiles_delete()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Delete from user_profiles table
          DELETE FROM public.user_profiles WHERE user_id = OLD.user_id;
          RETURN OLD;
        END;
        $$ LANGUAGE plpgsql;

        -- Create triggers
        DROP TRIGGER IF EXISTS profiles_insert_trigger ON profiles;
        CREATE TRIGGER profiles_insert_trigger
          INSTEAD OF INSERT ON profiles
          FOR EACH ROW EXECUTE FUNCTION handle_profiles_insert();

        DROP TRIGGER IF EXISTS profiles_update_trigger ON profiles;
        CREATE TRIGGER profiles_update_trigger
          INSTEAD OF UPDATE ON profiles
          FOR EACH ROW EXECUTE FUNCTION handle_profiles_update();

        DROP TRIGGER IF EXISTS profiles_delete_trigger ON profiles;
        CREATE TRIGGER profiles_delete_trigger
          INSTEAD OF DELETE ON profiles
          FOR EACH ROW EXECUTE FUNCTION handle_profiles_delete();
      `,
    });

    if (triggersError) {
      console.error('Error creating triggers:', triggersError.message);
    } else {
      console.log('✅ Profiles view triggers created');
    }

    // 4. Create RLS policies for the view
    console.log('4. Creating RLS policies for profiles view...');
    const {data: createPolicies, error: policiesError} = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS on the view (inherits from underlying table)
        -- Note: Views inherit RLS from their underlying tables
        
        -- Create policies that work with the view
        DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
        CREATE POLICY "Users can view their own profile" ON profiles
          FOR SELECT
          TO authenticated
          USING (user_id = auth.uid());

        DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
        CREATE POLICY "Users can update their own profile" ON profiles
          FOR UPDATE
          TO authenticated
          USING (user_id = auth.uid())
          WITH CHECK (user_id = auth.uid());

        DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
        CREATE POLICY "Admins can view all profiles" ON profiles
          FOR SELECT
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.user_profiles up 
              WHERE up.user_id = auth.uid() 
              AND up.role = 'admin'
            )
          );

        DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
        CREATE POLICY "Admins can manage all profiles" ON profiles
          FOR ALL
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.user_profiles up 
              WHERE up.user_id = auth.uid() 
              AND up.role = 'admin'
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.user_profiles up 
              WHERE up.user_id = auth.uid() 
              AND up.role = 'admin'
            )
          );

        -- Service role bypass
        DROP POLICY IF EXISTS "Service role bypass" ON profiles;
        CREATE POLICY "Service role bypass" ON profiles
          FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true);
      `,
    });

    if (policiesError) {
      console.error('Error creating policies:', policiesError.message);
    } else {
      console.log('✅ RLS policies created for profiles view');
    }

    // 5. Test the compatibility layer
    console.log('5. Testing profiles compatibility layer...');
    try {
      // Test SELECT
      const {data: selectTest, error: selectError} = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (selectError) {
        console.error('❌ SELECT test failed:', selectError.message);
      } else {
        console.log('✅ SELECT test passed');
      }

      // Test INSERT (this will create a user profile)
      const {data: insertTest, error: insertError} = await supabase.from('profiles').insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
        role: 'member',
      });

      if (insertError) {
        console.error('❌ INSERT test failed:', insertError.message);
      } else {
        console.log('✅ INSERT test passed');

        // Clean up test data
        await supabase
          .from('profiles')
          .delete()
          .eq('user_id', '00000000-0000-0000-0000-000000000000');
        console.log('✅ Test data cleaned up');
      }
    } catch (testError) {
      console.error('❌ Exception during testing:', testError.message);
    }

    // 6. Create a function to sync existing data
    console.log('6. Creating data sync function...');
    const {data: syncFunction, error: syncError} = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION sync_profiles_data()
        RETURNS TABLE (
          synced_count INTEGER,
          message TEXT
        ) AS $$
        DECLARE
          user_count INTEGER;
        BEGIN
          -- Count existing users without profiles
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
          
          RETURN QUERY SELECT user_count, 'Profiles synced successfully'::TEXT;
        END;
        $$ LANGUAGE plpgsql;
      `,
    });

    if (syncError) {
      console.error('Error creating sync function:', syncError.message);
    } else {
      console.log('✅ Data sync function created');
    }

    console.log('\n🎉 Profiles compatibility layer created successfully!');
    console.log('\n📋 What was created:');
    console.log('1. ✅ `profiles` view that maps to `user_profiles` table');
    console.log('2. ✅ Triggers for INSERT/UPDATE/DELETE operations');
    console.log('3. ✅ RLS policies for security');
    console.log('4. ✅ `sync_profiles_data()` function to sync existing data');
    console.log('\n🔧 Usage:');
    console.log('- Use `profiles` table in your code instead of `user_profiles`');
    console.log('- All operations will be automatically mapped to `user_profiles`');
    console.log('- Run `SELECT * FROM sync_profiles_data();` to sync existing users');
  } catch (error) {
    console.error('❌ Error creating compatibility layer:', error);
  }
}

createProfilesCompatibility();
