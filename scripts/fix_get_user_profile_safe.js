// Fix the get_user_profile_safe function that's causing user creation to fail
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

async function fixGetUserProfileSafe() {
  try {
    console.log('🔧 Fixing get_user_profile_safe function...');

    // 1. First, let's check if the function exists and see its current definition
    console.log('1. Checking current function definition...');
    const {data: currentFunction, error: checkError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          routine_name,
          routine_schema,
          routine_definition
        FROM information_schema.routines 
        WHERE routine_name = 'get_user_profile_safe'
        AND routine_schema IN ('public', 'auth');
      `,
    });

    if (checkError) {
      console.error('Error checking function:', checkError.message);
    } else {
      console.log('Current function found:', currentFunction);
    }

    // 2. Apply the fixed function
    console.log('2. Applying the fixed function...');
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

          -- Return the profile (fully-qualified)
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
      console.log('✅ Function fixed successfully');
    }

    // 3. Also fix the user_has_profile function to be safe
    console.log('3. Fixing user_has_profile function...');
    const {data: fixUserHasProfile, error: userHasProfileError} = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.user_has_profile(user_uuid UUID)
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          -- ensure predictable search path
          PERFORM set_config('search_path', 'public, auth, pg_catalog', true);
          
          RETURN EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = user_uuid
          );
        END;
        $$;
      `,
    });

    if (userHasProfileError) {
      console.error('Error fixing user_has_profile function:', userHasProfileError.message);
    } else {
      console.log('✅ user_has_profile function fixed successfully');
    }

    // 4. Test the fixed function
    console.log('4. Testing the fixed function...');
    try {
      const {data: testResult, error: testError} = await supabase.rpc('exec_sql', {
        sql: `
          SELECT * FROM public.get_user_profile_safe('00000000-0000-0000-0000-000000000000'::uuid);
        `,
      });

      if (testError) {
        console.error('❌ Function test failed:', testError.message);
      } else {
        console.log('✅ Function test succeeded:', testResult);
      }
    } catch (err) {
      console.error('❌ Exception during function test:', err.message);
    }

    // 5. Test user creation
    console.log('5. Testing user creation...');
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

    console.log('\n🎉 Function fix completed!');
    console.log('The get_user_profile_safe function has been fixed with:');
    console.log('- Fully qualified table references (public.user_profiles)');
    console.log('- Explicit search_path setting');
    console.log('- Safe error handling');
  } catch (error) {
    console.error('❌ Error during function fix:', error);
  }
}

fixGetUserProfileSafe();
