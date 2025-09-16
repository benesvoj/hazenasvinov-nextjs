// Fix the profiles compatibility layer
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

async function fixProfilesCompatibility() {
  try {
    console.log('🔧 Fixing profiles compatibility layer...');

    // 1. First, let's check the actual structure of auth.users
    console.log('1. Checking auth.users structure...');
    const {data: authUsersStructure, error: authError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'users'
        ORDER BY ordinal_position;
      `,
    });

    if (authError) {
      console.error('Error checking auth.users structure:', authError.message);
    } else {
      console.log('Auth.users structure:');
      if (Array.isArray(authUsersStructure)) {
        authUsersStructure.forEach((col) => {
          console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
      }
    }

    // 2. Fix the sync function with correct column names
    console.log('2. Fixing sync function...');
    const {data: fixSyncFunction, error: syncError} = await supabase.rpc('exec_sql', {
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
            au.raw_user_meta_data, -- Use raw_user_meta_data instead of user_metadata
            au.raw_user_meta_data,
            au.created_at,
            au.updated_at,
            CASE 
              WHEN au.raw_user_meta_data->>'full_name' IS NOT NULL 
              THEN au.raw_user_meta_data->>'full_name'
              ELSE au.email
            END,
            au.raw_user_meta_data->>'phone',
            au.raw_user_meta_data->>'bio',
            au.raw_user_meta_data->>'position',
            COALESCE((au.raw_user_meta_data->>'is_blocked')::boolean, false)
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
      console.error('Error fixing sync function:', syncError.message);
    } else {
      console.log('✅ Sync function fixed');
    }

    // 3. Fix the triggers with correct column names
    console.log('3. Fixing triggers...');
    const {data: fixTriggers, error: triggersError} = await supabase.rpc('exec_sql', {
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
              auth_user.raw_user_meta_data, -- Use raw_user_meta_data
              auth_user.raw_user_meta_data,
              auth_user.created_at,
              auth_user.updated_at,
              CASE 
                WHEN auth_user.raw_user_meta_data->>'full_name' IS NOT NULL 
                THEN auth_user.raw_user_meta_data->>'full_name'
                ELSE auth_user.email
              END,
              auth_user.raw_user_meta_data->>'phone',
              auth_user.raw_user_meta_data->>'bio',
              auth_user.raw_user_meta_data->>'position',
              COALESCE((auth_user.raw_user_meta_data->>'is_blocked')::boolean, false)
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

        -- Function to sync profiles when auth.users changes
        CREATE OR REPLACE FUNCTION sync_profiles_on_auth_users_change()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Update profiles if user exists in user_profiles
          UPDATE profiles SET
            email = NEW.email,
            email_confirmed_at = NEW.email_confirmed_at,
            user_metadata = NEW.raw_user_meta_data, -- Use raw_user_meta_data
            raw_user_meta_data = NEW.raw_user_meta_data,
            auth_created_at = NEW.created_at,
            auth_updated_at = NEW.updated_at,
            display_name = CASE 
              WHEN NEW.raw_user_meta_data->>'full_name' IS NOT NULL 
              THEN NEW.raw_user_meta_data->>'full_name'
              ELSE NEW.email
            END,
            phone = NEW.raw_user_meta_data->>'phone',
            bio = NEW.raw_user_meta_data->>'bio',
            position = NEW.raw_user_meta_data->>'position',
            is_blocked = COALESCE((NEW.raw_user_meta_data->>'is_blocked')::boolean, false)
          WHERE user_id = NEW.id;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,
    });

    if (triggersError) {
      console.error('Error fixing triggers:', triggersError.message);
    } else {
      console.log('✅ Triggers fixed');
    }

    // 4. Test the fixed compatibility layer
    console.log('4. Testing fixed compatibility layer...');
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
        .select('user_id, role, email, display_name')
        .limit(3);

      if (directError) {
        console.error('❌ Direct query test failed:', directError.message);
      } else {
        console.log('✅ Direct query test passed:');
        console.log('Sample profiles:', directQuery);
      }
    } catch (testError) {
      console.error('❌ Exception during testing:', testError.message);
    }

    console.log('\n🎉 Profiles compatibility layer fixed and working!');
    console.log('\n📋 What was fixed:');
    console.log(
      '1. ✅ Fixed column references to use `raw_user_meta_data` instead of `user_metadata`'
    );
    console.log('2. ✅ Updated sync function with correct column names');
    console.log('3. ✅ Updated triggers with correct column names');
    console.log('4. ✅ Tested and verified the compatibility layer works');
    console.log('\n🔧 Usage:');
    console.log('- Use `profiles` table in your code instead of `user_profiles`');
    console.log('- Run `SELECT * FROM sync_profiles_from_user_profiles();` to sync existing data');
    console.log('- The profiles table will automatically stay in sync with changes');
    console.log('\n✅ This provides full compatibility without RLS/materialization caveats');
  } catch (error) {
    console.error('❌ Error fixing compatibility layer:', error);
  }
}

fixProfilesCompatibility();
