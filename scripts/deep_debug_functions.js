// Deep debug to find all functions that might be causing the issue
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

async function deepDebugFunctions() {
  try {
    console.log('🔍 Deep debugging functions...');

    // 1. Find ALL functions that reference user_profiles
    console.log('1. Finding ALL functions that reference user_profiles...');
    const {data: allFunctions, error: allFunctionsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          n.nspname as schema_name,
          p.proname as function_name,
          pg_get_function_result(p.oid) as return_type,
          pg_get_function_arguments(p.oid) as arguments,
          pg_get_functiondef(p.oid) as definition
        FROM pg_proc p
        LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE pg_get_functiondef(p.oid) LIKE '%user_profiles%'
        ORDER BY n.nspname, p.proname;
      `,
    });

    if (allFunctionsError) {
      console.error('Error finding functions:', allFunctionsError.message);
    } else {
      console.log('All functions that reference user_profiles:');
      if (Array.isArray(allFunctions)) {
        allFunctions.forEach((func) => {
          console.log(`- ${func.schema_name}.${func.function_name}`);
          console.log(`  Definition: ${func.definition?.substring(0, 200)}...`);
        });
      } else {
        console.log('No functions found or error in query');
      }
    }

    // 2. Check if there are any triggers that might be calling these functions
    console.log('2. Checking triggers...');
    const {data: allTriggers, error: triggersError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          trigger_name,
          event_object_schema,
          event_object_table,
          action_timing,
          action_statement
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth'
        ORDER BY trigger_name;
      `,
    });

    if (triggersError) {
      console.error('Error checking triggers:', triggersError.message);
    } else {
      console.log('All triggers on auth schema:');
      if (Array.isArray(allTriggers)) {
        allTriggers.forEach((trigger) => {
          console.log(
            `- ${trigger.trigger_name} on ${trigger.event_object_schema}.${trigger.event_object_table}`
          );
          console.log(`  Action: ${trigger.action_statement}`);
        });
      } else {
        console.log('No triggers found or error in query');
      }
    }

    // 3. Check if there are any other functions in the auth schema
    console.log('3. Checking functions in auth schema...');
    const {data: authFunctions, error: authFunctionsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          routine_name,
          routine_type,
          data_type
        FROM information_schema.routines 
        WHERE routine_schema = 'auth'
        ORDER BY routine_name;
      `,
    });

    if (authFunctionsError) {
      console.error('Error checking auth functions:', authFunctionsError.message);
    } else {
      console.log('Functions in auth schema:');
      if (Array.isArray(authFunctions)) {
        authFunctions.forEach((func) => {
          console.log(`- ${func.routine_name} (${func.routine_type})`);
        });
      } else {
        console.log('No functions found or error in query');
      }
    }

    // 4. Try to disable all triggers temporarily
    console.log('4. Trying to disable all triggers temporarily...');
    const {data: disableTriggers, error: disableError} = await supabase.rpc('exec_sql', {
      sql: `
        -- Disable all triggers on auth.users
        ALTER TABLE auth.users DISABLE TRIGGER ALL;
      `,
    });

    if (disableError) {
      console.error('Error disabling triggers:', disableError.message);
    } else {
      console.log('✅ All triggers disabled');

      // Test user creation with triggers disabled
      console.log('Testing user creation with triggers disabled...');
      try {
        const {data: createData, error: createError} = await supabase.auth.admin.createUser({
          email: `test-no-triggers-${Date.now()}@example.com`,
          password: 'Test123!',
          email_confirm: true,
        });

        if (createError) {
          console.error(
            '❌ User creation still failed with triggers disabled:',
            createError.message
          );
        } else {
          console.log('✅ User creation succeeded with triggers disabled!');
          console.log('   User ID:', createData.user?.id);

          // Clean up
          await supabase.auth.admin.deleteUser(createData.user.id);
          console.log('✅ Test user cleaned up');
        }
      } catch (err) {
        console.error('❌ Exception during test:', err.message);
      }

      // Re-enable triggers
      console.log('Re-enabling triggers...');
      const {data: enableTriggers, error: enableError} = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE auth.users ENABLE TRIGGER ALL;
        `,
      });

      if (enableError) {
        console.error('Error re-enabling triggers:', enableError.message);
      } else {
        console.log('✅ Triggers re-enabled');
      }
    }

    // 5. Check if there are any other issues
    console.log('5. Checking for other potential issues...');
    const {data: otherIssues, error: otherError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          'user_profiles table exists' as check_name,
          EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles'
          ) as result
        UNION ALL
        SELECT 
          'user_profiles has data' as check_name,
          (SELECT COUNT(*) > 0 FROM public.user_profiles) as result
        UNION ALL
        SELECT 
          'user_profiles RLS enabled' as check_name,
          (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_profiles' AND relnamespace = 'public'::regnamespace) as result;
      `,
    });

    if (otherError) {
      console.error('Error checking other issues:', otherError.message);
    } else {
      console.log('Other checks:');
      if (Array.isArray(otherIssues)) {
        otherIssues.forEach((check) => {
          console.log(`- ${check.check_name}: ${check.result}`);
        });
      } else {
        console.log('No checks found or error in query');
      }
    }
  } catch (error) {
    console.error('❌ Error during deep debug:', error);
  }
}

deepDebugFunctions();
