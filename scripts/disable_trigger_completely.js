// Disable trigger completely and test user creation
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

async function disableTriggerCompletely() {
  try {
    console.log('🔧 Disabling trigger completely and testing...');

    // 1. Drop the trigger
    console.log('1. Dropping trigger...');
    const {data: dropTrigger, error: dropError} = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      `,
    });

    if (dropError) {
      console.error('Error dropping trigger:', dropError.message);
    } else {
      console.log('✅ Trigger dropped successfully');
    }

    // 2. Drop the function
    console.log('2. Dropping function...');
    const {data: dropFunction, error: functionError} = await supabase.rpc('exec_sql', {
      sql: `
        DROP FUNCTION IF EXISTS handle_new_user();
      `,
    });

    if (functionError) {
      console.error('Error dropping function:', functionError.message);
    } else {
      console.log('✅ Function dropped successfully');
    }

    // 3. Test user creation without trigger
    console.log('3. Testing user creation without trigger...');
    try {
      const {data: testData, error: testError} = await supabase.auth.admin.createUser({
        email: `test-no-trigger-${Date.now()}@example.com`,
        password: 'Test123!',
        email_confirm: true,
      });

      if (testError) {
        console.error('❌ User creation failed even without trigger:', testError.message);
        console.error('   Code:', testError.code);
        console.error('   Status:', testError.status);
      } else {
        console.log('✅ User creation succeeded without trigger!');
        console.log('   User ID:', testData.user?.id);
        console.log('   User email:', testData.user?.email);

        // Clean up
        await supabase.auth.admin.deleteUser(testData.user.id);
        console.log('✅ Test user cleaned up');
      }
    } catch (err) {
      console.error('❌ Exception during test:', err.message);
    }

    // 4. Check if there are other triggers on auth.users
    console.log('4. Checking for other triggers on auth.users...');
    const {data: otherTriggers, error: triggersError} = await supabase.rpc('exec_sql', {
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

    if (triggersError) {
      console.error('Error checking triggers:', triggersError.message);
    } else {
      console.log('✅ Other triggers on auth.users:');
      console.log(otherTriggers);
    }

    // 5. Check if there are any functions that might be interfering
    console.log('5. Checking for interfering functions...');
    const {data: functions, error: functionsError} = await supabase.rpc('exec_sql', {
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

    if (functionsError) {
      console.error('Error checking functions:', functionsError.message);
    } else {
      console.log('✅ User-related functions:');
      console.log(functions);
    }

    // 6. Check if there are any constraints on auth.users
    console.log('6. Checking constraints on auth.users...');
    const {data: constraints, error: constraintsError} = await supabase.rpc('exec_sql', {
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
      console.error('Error checking constraints:', constraintsError.message);
    } else {
      console.log('✅ Constraints on auth.users:');
      console.log(constraints);
    }

    // 7. Try creating user with different parameters
    console.log('7. Testing with different user creation parameters...');
    try {
      const {data: testData2, error: testError2} = await supabase.auth.admin.createUser({
        email: `test-different-${Date.now()}@example.com`,
        password: 'Test123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'Test User',
        },
      });

      if (testError2) {
        console.error('❌ User creation with metadata failed:', testError2.message);
      } else {
        console.log('✅ User creation with metadata succeeded!');
        console.log('   User ID:', testData2.user?.id);

        // Clean up
        await supabase.auth.admin.deleteUser(testData2.user.id);
        console.log('✅ Test user cleaned up');
      }
    } catch (err) {
      console.error('❌ Exception during metadata test:', err.message);
    }
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

disableTriggerCompletely();
