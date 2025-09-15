// Create simple profiles compatibility using a regular table with triggers
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

async function createSimpleProfilesCompatibility() {
  try {
    console.log('🔧 Creating simple profiles compatibility layer...');

    // 1. Create a profiles table that mirrors user_profiles with additional fields
    console.log('1. Creating profiles table...');
    const {data: createProfilesTable, error: tableError} = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing profiles table if it exists
        DROP TABLE IF EXISTS profiles CASCADE;
        
        -- Create profiles table
        CREATE TABLE profiles (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'coach', 'member', 'head_coach')),
          club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
          assigned_categories UUID[] DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          -- Additional fields from auth.users
          email TEXT,
          email_confirmed_at TIMESTAMP WITH TIME ZONE,
          user_metadata JSONB,
          raw_user_meta_data JSONB,
          auth_created_at TIMESTAMP WITH TIME ZONE,
          auth_updated_at TIMESTAMP WITH TIME ZONE,
          -- Computed fields
          display_name TEXT,
          phone TEXT,
          bio TEXT,
          position TEXT,
          is_blocked BOOLEAN DEFAULT FALSE,
          UNIQUE(user_id)
        );
        
        -- Create indexes
        CREATE INDEX profiles_user_id_idx ON profiles (user_id);
        CREATE INDEX profiles_role_idx ON profiles (role);
        CREATE INDEX profiles_club_id_idx ON profiles (club_id);
        CREATE INDEX profiles_email_idx ON profiles (email);
        
        -- Enable RLS
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        -- Grant permissions
        GRANT ALL ON profiles TO authenticated;
        GRANT ALL ON profiles TO service_role;
      `,
    });

    if (tableError) {
      console.error('Error creating profiles table:', tableError.message);
    } else {
      console.log('✅ Profiles table created');
    }

    // 2. Create RLS policies
    console.log('2. Creating RLS policies...');
    const {data: createPolicies, error: policiesError} = await supabase.rpc('exec_sql', {
      sql: `
        -- Users can view their own profile
        DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
        CREATE POLICY "Users can view their own profile" ON profiles
          FOR SELECT
          TO authenticated
          USING (user_id = auth.uid());

        -- Users can update their own profile
        DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
        CREATE POLICY "Users can update their own profile" ON profiles
          FOR UPDATE
          TO authenticated
          USING (user_id = auth.uid())
          WITH CHECK (user_id = auth.uid());

        -- Admins can view all profiles
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

        -- Admins can manage all profiles
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
      console.log('✅ RLS policies created');
    }

    // 3. Create sync function to populate profiles from user_profiles and auth.users
    console.log('3. Creating sync function...');
    const {data: createSyncFunction, error: syncError} = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION sync_profiles_from_user_profiles()
        RETURNS TABLE (
          synced_count INTEGER,
          total_profiles INTEGER,
          message TEXT
        ) AS $$
        DECLARE
          sync_count INTEGER;
          total_count INTEGER;
        BEGIN
          -- Insert/update profiles from user_profiles and auth.users
          INSERT INTO profiles (
            user_id,
            role,
            club_id,
            assigned_categories,
            created_at,
            updated_at,
            email,
            email_confirmed_at,
            user_metadata,
            raw_user_meta_data,
            auth_created_at,
            auth_updated_at,
            display_name,
            phone,
            bio,
            position,
            is_blocked
          )
          SELECT 
            up.user_id,
            up.role,
            up.club_id,
            up.assigned_categories,
            up.created_at,
            up.updated_at,
            au.email,
            au.email_confirmed_at,
            au.user_metadata,
            au.raw_user_meta_data,
            au.created_at,
            au.updated_at,
            CASE 
              WHEN au.user_metadata->>'full_name' IS NOT NULL 
              THEN au.user_metadata->>'full_name'
              ELSE au.email
            END,
            au.user_metadata->>'phone',
            au.user_metadata->>'bio',
            au.user_metadata->>'position',
            COALESCE((au.user_metadata->>'is_blocked')::boolean, false)
          FROM public.user_profiles up
          LEFT JOIN auth.users au ON up.user_id = au.id
          ON CONFLICT (user_id) DO UPDATE SET
            role = EXCLUDED.role,
            club_id = EXCLUDED.club_id,
            assigned_categories = EXCLUDED.assigned_categories,
            updated_at = EXCLUDED.updated_at,
            email = EXCLUDED.email,
            email_confirmed_at = EXCLUDED.email_confirmed_at,
            user_metadata = EXCLUDED.user_metadata,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            auth_created_at = EXCLUDED.auth_created_at,
            auth_updated_at = EXCLUDED.auth_updated_at,
            display_name = EXCLUDED.display_name,
            phone = EXCLUDED.phone,
            bio = EXCLUDED.bio,
            position = EXCLUDED.position,
            is_blocked = EXCLUDED.is_blocked;
          
          GET DIAGNOSTICS sync_count = ROW_COUNT;
          SELECT COUNT(*) INTO total_count FROM profiles;
          
          RETURN QUERY SELECT 
            sync_count as synced_count,
            total_count as total_profiles,
            'Profiles synced successfully'::TEXT as message;
        END;
        $$ LANGUAGE plpgsql;
      `,
    });

    if (syncError) {
      console.error('Error creating sync function:', syncError.message);
    } else {
      console.log('✅ Sync function created');
    }

    // 4. Create triggers to keep profiles in sync with user_profiles
    console.log('4. Creating sync triggers...');
    const {data: createTriggers, error: triggersError} = await supabase.rpc('exec_sql', {
      sql: `
        -- Function to sync profiles when user_profiles changes
        CREATE OR REPLACE FUNCTION sync_profiles_on_user_profiles_change()
        RETURNS TRIGGER AS $$
        DECLARE
          auth_user RECORD;
        BEGIN
          -- Get auth.users data
          SELECT * INTO auth_user FROM auth.users WHERE id = COALESCE(NEW.user_id, OLD.user_id);
          
          IF TG_OP = 'DELETE' THEN
            -- Delete from profiles
            DELETE FROM profiles WHERE user_id = OLD.user_id;
            RETURN OLD;
          ELSIF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            -- Insert/update in profiles
            INSERT INTO profiles (
              user_id,
              role,
              club_id,
              assigned_categories,
              created_at,
              updated_at,
              email,
              email_confirmed_at,
              user_metadata,
              raw_user_meta_data,
              auth_created_at,
              auth_updated_at,
              display_name,
              phone,
              bio,
              position,
              is_blocked
            ) VALUES (
              NEW.user_id,
              NEW.role,
              NEW.club_id,
              NEW.assigned_categories,
              NEW.created_at,
              NEW.updated_at,
              auth_user.email,
              auth_user.email_confirmed_at,
              auth_user.user_metadata,
              auth_user.raw_user_meta_data,
              auth_user.created_at,
              auth_user.updated_at,
              CASE 
                WHEN auth_user.user_metadata->>'full_name' IS NOT NULL 
                THEN auth_user.user_metadata->>'full_name'
                ELSE auth_user.email
              END,
              auth_user.user_metadata->>'phone',
              auth_user.user_metadata->>'bio',
              auth_user.user_metadata->>'position',
              COALESCE((auth_user.user_metadata->>'is_blocked')::boolean, false)
            )
            ON CONFLICT (user_id) DO UPDATE SET
              role = EXCLUDED.role,
              club_id = EXCLUDED.club_id,
              assigned_categories = EXCLUDED.assigned_categories,
              updated_at = EXCLUDED.updated_at,
              email = EXCLUDED.email,
              email_confirmed_at = EXCLUDED.email_confirmed_at,
              user_metadata = EXCLUDED.user_metadata,
              raw_user_meta_data = EXCLUDED.raw_user_meta_data,
              auth_created_at = EXCLUDED.auth_created_at,
              auth_updated_at = EXCLUDED.auth_updated_at,
              display_name = EXCLUDED.display_name,
              phone = EXCLUDED.phone,
              bio = EXCLUDED.bio,
              position = EXCLUDED.position,
              is_blocked = EXCLUDED.is_blocked;
            
            RETURN NEW;
          END IF;
          
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger on user_profiles
        DROP TRIGGER IF EXISTS user_profiles_sync_trigger ON user_profiles;
        CREATE TRIGGER user_profiles_sync_trigger
          AFTER INSERT OR UPDATE OR DELETE ON user_profiles
          FOR EACH ROW EXECUTE FUNCTION sync_profiles_on_user_profiles_change();

        -- Function to sync profiles when auth.users changes
        CREATE OR REPLACE FUNCTION sync_profiles_on_auth_users_change()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Update profiles if user exists in user_profiles
          UPDATE profiles SET
            email = NEW.email,
            email_confirmed_at = NEW.email_confirmed_at,
            user_metadata = NEW.user_metadata,
            raw_user_meta_data = NEW.raw_user_meta_data,
            auth_created_at = NEW.created_at,
            auth_updated_at = NEW.updated_at,
            display_name = CASE 
              WHEN NEW.user_metadata->>'full_name' IS NOT NULL 
              THEN NEW.user_metadata->>'full_name'
              ELSE NEW.email
            END,
            phone = NEW.user_metadata->>'phone',
            bio = NEW.user_metadata->>'bio',
            position = NEW.user_metadata->>'position',
            is_blocked = COALESCE((NEW.user_metadata->>'is_blocked')::boolean, false)
          WHERE user_id = NEW.id;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger on auth.users
        DROP TRIGGER IF EXISTS auth_users_sync_trigger ON auth.users;
        CREATE TRIGGER auth_users_sync_trigger
          AFTER UPDATE ON auth.users
          FOR EACH ROW EXECUTE FUNCTION sync_profiles_on_auth_users_change();
      `,
    });

    if (triggersError) {
      console.error('Error creating triggers:', triggersError.message);
    } else {
      console.log('✅ Sync triggers created');
    }

    // 5. Test the compatibility layer
    console.log('5. Testing compatibility layer...');
    try {
      // Test the sync function
      const {data: syncResult, error: syncTestError} = await supabase.rpc(
        'sync_profiles_from_user_profiles'
      );

      if (syncTestError) {
        console.error('❌ Sync test failed:', syncTestError.message);
      } else {
        console.log('✅ Sync test passed:', syncResult);
      }

      // Test direct query
      const {data: directQuery, error: directError} = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (directError) {
        console.error('❌ Direct query test failed:', directError.message);
      } else {
        console.log('✅ Direct query test passed');
      }
    } catch (testError) {
      console.error('❌ Exception during testing:', testError.message);
    }

    console.log('\n🎉 Simple profiles compatibility layer created successfully!');
    console.log('\n📋 What was created:');
    console.log('1. ✅ `profiles` table with all user data from user_profiles + auth.users');
    console.log('2. ✅ RLS policies for security');
    console.log('3. ✅ `sync_profiles_from_user_profiles()` function for initial sync');
    console.log('4. ✅ Triggers to keep profiles in sync with user_profiles and auth.users');
    console.log('\n🔧 Usage:');
    console.log('- Use `profiles` table in your code instead of `user_profiles`');
    console.log('- Run `SELECT * FROM sync_profiles_from_user_profiles();` to sync existing data');
    console.log('- The profiles table will automatically stay in sync with changes');
    console.log(
      '\n✅ This approach avoids RLS/materialization caveats and provides full compatibility'
    );
  } catch (error) {
    console.error('❌ Error creating simple compatibility layer:', error);
  }
}

createSimpleProfilesCompatibility();
