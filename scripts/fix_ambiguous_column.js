// Fix the ambiguous column reference in get_user_profile_safe function
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

async function fixAmbiguousColumn() {
  try {
    console.log('🔧 Fixing ambiguous column reference...');

    // Fix the get_user_profile_safe function with proper column aliases
    const {data: fixResult, error: fixError} = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.get_user_profile_safe(user_uuid uuid)
        RETURNS TABLE (
          user_id uuid,
          role text,
          club_id uuid,
          assigned_categories uuid[],
          created_at timestamptz
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
          -- ensure predictable search path and avoid accidental schema resolution issues
          PERFORM set_config('search_path', 'public, auth, pg_catalog', true);

          -- Check if profile exists
          IF NOT user_has_profile(user_uuid) THEN
            -- Create profile if it doesn't exist (fallback for existing users)
            INSERT INTO public.user_profiles (user_id, role, created_at, updated_at)
            VALUES (user_uuid, 'member', NOW(), NOW())
            ON CONFLICT (user_id) DO NOTHING;
          END IF;

          -- Return the profile (fully-qualified with proper aliases)
          RETURN QUERY
          SELECT 
            up.user_id,
            up.role,
            up.club_id,
            up.assigned_categories,
            up.created_at
          FROM public.user_profiles up
          WHERE up.user_id = user_uuid;
        END;
        $$;
      `,
    });

    if (fixError) {
      console.error('Error fixing function:', fixError.message);
      return;
    } else {
      console.log('✅ Function fixed with proper column aliases');
    }

    // Test the fixed function
    console.log('Testing the fixed function...');
    try {
      const {data: testResult, error: testError} = await supabase.rpc('exec_sql', {
        sql: `
          SELECT * FROM public.get_user_profile_safe('00000000-0000-0000-0000-000000000000'::uuid);
        `,
      });

      if (testError) {
        console.error('❌ Function test failed:', testError.message);
      } else {
        console.log('✅ Function test succeeded');
      }
    } catch (err) {
      console.error('❌ Exception during function test:', err.message);
    }

    // Test user creation
    console.log('Testing user creation...');
    try {
      const {data: createData, error: createError} = await supabase.auth.admin.createUser({
        email: `test-fixed-${Date.now()}@example.com`,
        password: 'Test123!',
        email_confirm: true,
      });

      if (createError) {
        console.error('❌ User creation still failed:', createError.message);
        console.error('   Code:', createError.code);
        console.error('   Status:', createError.status);
      } else {
        console.log('✅ User creation succeeded!');
        console.log('   User ID:', createData.user?.id);
        console.log('   User email:', createData.user?.email);

        // Check if profile was created
        const {data: profileData, error: profileError} = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', createData.user.id)
          .single();

        if (profileError) {
          console.error('❌ Profile not created:', profileError.message);
        } else {
          console.log('✅ Profile created successfully:', profileData);
        }

        // Clean up test user
        await supabase.auth.admin.deleteUser(createData.user.id);
        console.log('✅ Test user cleaned up');
      }
    } catch (err) {
      console.error('❌ Exception during user creation test:', err.message);
    }
  } catch (error) {
    console.error('❌ Error during fix:', error);
  }
}

fixAmbiguousColumn();
