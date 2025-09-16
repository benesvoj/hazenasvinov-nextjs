// Debug database constraints and configuration
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

async function debugDatabase() {
  try {
    console.log('🔍 Debugging database constraints and configuration...');

    // 1. Check if we can access the database at all
    console.log('1. Testing basic database access...');
    const {data: testData, error: testError} = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Database access failed:', testError.message);
      return;
    } else {
      console.log('✅ Database access working');
    }

    // 2. Check user_profiles table structure
    console.log('2. Checking user_profiles table structure...');
    const {data: tableInfo, error: tableError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `,
    });

    if (tableError) {
      console.error('Error getting table info:', tableError.message);
    } else {
      console.log('✅ user_profiles table structure:');
      console.log(tableInfo);
    }

    // 3. Check constraints on user_profiles
    console.log('3. Checking constraints on user_profiles...');
    const {data: constraints, error: constraintError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          conname as constraint_name,
          contype as constraint_type,
          pg_get_constraintdef(oid) as constraint_definition
        FROM pg_constraint 
        WHERE conrelid = 'user_profiles'::regclass;
      `,
    });

    if (constraintError) {
      console.error('Error getting constraints:', constraintError.message);
    } else {
      console.log('✅ user_profiles constraints:');
      console.log(constraints);
    }

    // 4. Check if there are any triggers on auth.users
    console.log('4. Checking triggers on auth.users...');
    const {data: triggers, error: triggerError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          trigger_name,
          event_manipulation,
          action_timing,
          action_statement
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND event_object_schema = 'auth';
      `,
    });

    if (triggerError) {
      console.error('Error getting triggers:', triggerError.message);
    } else {
      console.log('✅ auth.users triggers:');
      console.log(triggers);
    }

    // 5. Check RLS policies on user_profiles
    console.log('5. Checking RLS policies on user_profiles...');
    const {data: policies, error: policyError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE tablename = 'user_profiles';
      `,
    });

    if (policyError) {
      console.error('Error getting policies:', policyError.message);
    } else {
      console.log('✅ user_profiles RLS policies:');
      console.log(policies);
    }

    // 6. Check if there are any functions that might be interfering
    console.log('6. Checking functions that might interfere...');
    const {data: functions, error: functionError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          routine_name,
          routine_type,
          data_type
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name LIKE '%user%'
        ORDER BY routine_name;
      `,
    });

    if (functionError) {
      console.error('Error getting functions:', functionError.message);
    } else {
      console.log('✅ User-related functions:');
      console.log(functions);
    }

    // 7. Try to create a user with minimal data
    console.log('7. Testing minimal user creation...');
    const minimalEmail = `minimal-${Date.now()}@test.com`;

    try {
      const {data: minimalData, error: minimalError} = await supabase.auth.admin.createUser({
        email: minimalEmail,
        password: 'Test123!',
        email_confirm: true,
      });

      if (minimalError) {
        console.error('❌ Minimal user creation failed:', minimalError.message);
        console.error('Error code:', minimalError.code);
        console.error('Error status:', minimalError.status);
      } else {
        console.log('✅ Minimal user creation succeeded!');
        console.log('User ID:', minimalData.user?.id);

        // Clean up
        await supabase.auth.admin.deleteUser(minimalData.user.id);
        console.log('✅ Test user cleaned up');
      }
    } catch (err) {
      console.error('❌ Exception during minimal user creation:', err.message);
    }
  } catch (error) {
    console.error('❌ Error during debug:', error.message);
  }
}

debugDatabase();
