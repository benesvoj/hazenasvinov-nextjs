// Check Supabase authentication settings and project configuration
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

async function checkAuthSettings() {
  try {
    console.log('🔍 Checking Supabase authentication settings...');

    // 1. Check if there are any custom auth configurations
    console.log('\n1. Checking for custom auth configurations...');
    const {data: authConfig, error: authError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'users'
        ORDER BY ordinal_position;
      `,
    });

    if (authError) {
      console.error('Error checking auth config:', authError.message);
    } else {
      console.log('✅ Auth.users table structure:');
      console.log(authConfig);
    }

    // 2. Check if there are any custom functions in the auth schema
    console.log('\n2. Checking for custom auth functions...');
    const {data: authFunctions, error: functionsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          routine_name,
          routine_type,
          data_type,
          routine_definition
        FROM information_schema.routines 
        WHERE routine_schema = 'auth'
        AND routine_name LIKE '%user%'
        ORDER BY routine_name;
      `,
    });

    if (functionsError) {
      console.error('Error checking auth functions:', functionsError.message);
    } else {
      console.log('✅ Auth functions:');
      console.log(authFunctions);
    }

    // 3. Check if there are any triggers on auth.users
    console.log('\n3. Checking triggers on auth.users...');
    const {data: authTriggers, error: triggersError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          trigger_name,
          event_manipulation,
          action_timing,
          action_statement,
          action_orientation
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND event_object_schema = 'auth'
        ORDER BY trigger_name;
      `,
    });

    if (triggersError) {
      console.error('Error checking auth triggers:', triggersError.message);
    } else {
      console.log('✅ Auth.users triggers:');
      console.log(authTriggers);
    }

    // 4. Check if there are any constraints on auth.users
    console.log('\n4. Checking constraints on auth.users...');
    const {data: authConstraints, error: constraintsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          conname as constraint_name,
          contype as constraint_type,
          pg_get_constraintdef(oid) as constraint_definition
        FROM pg_constraint 
        WHERE conrelid = 'auth.users'::regclass;
      `,
    });

    if (constraintsError) {
      console.error('Error checking auth constraints:', constraintsError.message);
    } else {
      console.log('✅ Auth.users constraints:');
      console.log(authConstraints);
    }

    // 5. Check if there are any RLS policies on auth.users
    console.log('\n5. Checking RLS policies on auth.users...');
    const {data: authPolicies, error: policiesError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE tablename = 'users' 
        AND schemaname = 'auth';
      `,
    });

    if (policiesError) {
      console.error('Error checking auth policies:', policiesError.message);
    } else {
      console.log('✅ Auth.users RLS policies:');
      console.log(authPolicies);
    }

    // 6. Check if there are any custom configurations in the public schema
    console.log('\n6. Checking for custom configurations...');
    const {data: customConfig, error: configError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND (table_name LIKE '%config%' OR table_name LIKE '%setting%')
        ORDER BY table_name, ordinal_position;
      `,
    });

    if (configError) {
      console.error('Error checking custom config:', configError.message);
    } else {
      console.log('✅ Custom configuration tables:');
      console.log(customConfig);
    }

    // 7. Try a different approach - check if we can create a user with different parameters
    console.log('\n7. Testing different user creation approaches...');

    // Test 1: Minimal user creation
    console.log('Test 1: Minimal user creation...');
    try {
      const {data: minimalData, error: minimalError} = await supabase.auth.admin.createUser({
        email: `minimal-${Date.now()}@test.com`,
        password: 'Test123!',
        email_confirm: true,
      });

      if (minimalError) {
        console.error('❌ Minimal creation failed:', minimalError.message);
      } else {
        console.log('✅ Minimal creation succeeded!');
        await supabase.auth.admin.deleteUser(minimalData.user.id);
      }
    } catch (err) {
      console.error('❌ Exception in minimal creation:', err.message);
    }

    // Test 2: User creation with different email format
    console.log('Test 2: Different email format...');
    try {
      const {data: formatData, error: formatError} = await supabase.auth.admin.createUser({
        email: `test+${Date.now()}@example.com`,
        password: 'Test123!',
        email_confirm: true,
      });

      if (formatError) {
        console.error('❌ Format test failed:', formatError.message);
      } else {
        console.log('✅ Format test succeeded!');
        await supabase.auth.admin.deleteUser(formatData.user.id);
      }
    } catch (err) {
      console.error('❌ Exception in format test:', err.message);
    }

    // Test 3: Check if the issue is with the specific email domain
    console.log('Test 3: Different email domain...');
    try {
      const {data: domainData, error: domainError} = await supabase.auth.admin.createUser({
        email: `test-${Date.now()}@gmail.com`,
        password: 'Test123!',
        email_confirm: true,
      });

      if (domainError) {
        console.error('❌ Domain test failed:', domainError.message);
      } else {
        console.log('✅ Domain test succeeded!');
        await supabase.auth.admin.deleteUser(domainData.user.id);
      }
    } catch (err) {
      console.error('❌ Exception in domain test:', err.message);
    }
  } catch (error) {
    console.error('❌ Error during auth settings check:', error);
  }
}

checkAuthSettings();
