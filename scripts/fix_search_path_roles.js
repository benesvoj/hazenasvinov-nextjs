// Fix search_path for Supabase roles as suggested by the AI
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

async function fixSearchPathRoles() {
  try {
    console.log('🔧 Fixing search_path for Supabase roles...');

    // 1. Check current search_path for roles
    console.log('1. Checking current search_path for roles...');
    const {data: currentSearchPath, error: searchPathError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          rolname,
          rolsearchpath
        FROM pg_roles 
        WHERE rolname IN ('supabase_anonymous', 'supabase_service_role', 'supabase_auth_admin', 'supabase_auth')
        ORDER BY rolname;
      `,
    });

    if (searchPathError) {
      console.error('Error checking search_path:', searchPathError.message);
    } else {
      console.log('Current search_path for roles:');
      console.log(currentSearchPath);
    }

    // 2. Set search_path for Supabase roles
    console.log('2. Setting search_path for Supabase roles...');
    const {data: setSearchPath, error: setError} = await supabase.rpc('exec_sql', {
      sql: `
        ALTER ROLE supabase_anonymous SET search_path = public, auth, pg_catalog;
        ALTER ROLE supabase_service_role SET search_path = public, auth, pg_catalog;
        ALTER ROLE supabase_auth_admin SET search_path = public, auth, pg_catalog;
        ALTER ROLE supabase_auth SET search_path = public, auth, pg_catalog;
      `,
    });

    if (setError) {
      console.error('Error setting search_path:', setError.message);
    } else {
      console.log('✅ Search_path set for Supabase roles');
    }

    // 3. Test user creation after setting search_path
    console.log('3. Testing user creation after setting search_path...');
    try {
      const {data: createData, error: createError} = await supabase.auth.admin.createUser({
        email: `test-searchpath-${Date.now()}@example.com`,
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

    // 4. Test invitation flow
    console.log('4. Testing invitation flow...');
    try {
      const {data: inviteData, error: inviteError} = await supabase.auth.admin.inviteUserByEmail(
        `test-invite-searchpath-${Date.now()}@example.com`,
        {
          data: {
            full_name: 'Test User',
            phone: '123456789',
          },
        }
      );

      if (inviteError) {
        console.error('❌ Invite failed:', inviteError.message);
        console.error('   Code:', inviteError.code);
        console.error('   Status:', inviteError.status);
      } else {
        console.log('✅ Invite succeeded!');
        console.log('   User ID:', inviteData.user?.id);
        console.log('   User email:', inviteData.user?.email);

        // Clean up test user
        await supabase.auth.admin.deleteUser(inviteData.user.id);
        console.log('✅ Test user cleaned up');
      }
    } catch (err) {
      console.error('❌ Exception during invite test:', err.message);
    }

    console.log('\n🎉 Search_path fix completed!');
    console.log('If user creation still fails, the issue might be deeper in the Supabase service.');
  } catch (error) {
    console.error('❌ Error during search_path fix:', error);
  }
}

fixSearchPathRoles();
