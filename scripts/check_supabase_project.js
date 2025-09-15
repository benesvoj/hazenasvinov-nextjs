// Check Supabase project configuration and permissions
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

async function checkSupabaseProject() {
  try {
    console.log('🔍 Checking Supabase project configuration...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Role Key (first 20 chars):', serviceRoleKey.substring(0, 20) + '...');

    // 1. Test basic connection
    console.log('\n1. Testing basic connection...');
    const {data: testData, error: testError} = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (testError) {
      console.error('❌ Connection failed:', testError.message);
      return;
    } else {
      console.log('✅ Connection successful');
      console.log('Existing users count:', testData.users?.length || 0);
    }

    // 2. Check project settings
    console.log('\n2. Checking project settings...');
    const {data: settings, error: settingsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          current_database() as database_name,
          current_user as current_user,
          session_user as session_user,
          current_setting('server_version') as postgres_version;
      `,
    });

    if (settingsError) {
      console.error('Error getting settings:', settingsError.message);
    } else {
      console.log('✅ Project settings:');
      console.log(settings);
    }

    // 3. Check if there are any project-level restrictions
    console.log('\n3. Checking for project restrictions...');
    const {data: restrictions, error: restrictionsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          name,
          setting,
          unit,
          context
        FROM pg_settings 
        WHERE name LIKE '%auth%' 
        OR name LIKE '%user%'
        OR name LIKE '%create%'
        ORDER BY name;
      `,
    });

    if (restrictionsError) {
      console.error('Error checking restrictions:', restrictionsError.message);
    } else {
      console.log('✅ Auth-related settings:');
      console.log(restrictions);
    }

    // 4. Check if there are any custom functions that might be interfering
    console.log('\n4. Checking for interfering functions...');
    const {data: functions, error: functionsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          n.nspname as schema_name,
          p.proname as function_name,
          pg_get_function_result(p.oid) as return_type,
          pg_get_function_arguments(p.oid) as arguments
        FROM pg_proc p
        LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname LIKE '%user%'
        AND n.nspname IN ('public', 'auth')
        ORDER BY n.nspname, p.proname;
      `,
    });

    if (functionsError) {
      console.error('Error checking functions:', functionsError.message);
    } else {
      console.log('✅ User-related functions:');
      console.log(functions);
    }

    // 5. Try to get more detailed error information
    console.log('\n5. Testing with detailed error capture...');
    try {
      const {data: userData, error: userError} = await supabase.auth.admin.createUser({
        email: `debug-${Date.now()}@test.com`,
        password: 'Test123!',
        email_confirm: true,
      });

      if (userError) {
        console.error('❌ Detailed error information:');
        console.error('Message:', userError.message);
        console.error('Code:', userError.code);
        console.error('Status:', userError.status);
        console.error('Name:', userError.name);
        console.error('Stack:', userError.stack);
      } else {
        console.log('✅ User creation succeeded!');
        console.log('User ID:', userData.user?.id);

        // Clean up
        await supabase.auth.admin.deleteUser(userData.user.id);
        console.log('✅ Test user cleaned up');
      }
    } catch (err) {
      console.error('❌ Exception during user creation:', err);
    }

    // 6. Check if there are any database-level issues
    console.log('\n6. Checking database health...');
    const {data: health, error: healthError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          'Database is accessible' as status,
          now() as current_time,
          version() as postgres_version;
      `,
    });

    if (healthError) {
      console.error('❌ Database health check failed:', healthError.message);
    } else {
      console.log('✅ Database health check passed:');
      console.log(health);
    }
  } catch (error) {
    console.error('❌ Error during project check:', error);
  }
}

checkSupabaseProject();
