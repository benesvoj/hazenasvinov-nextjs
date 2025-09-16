// Analyze auth.users triggers to identify which ones are ours and which might be causing issues
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

async function analyzeAuthTriggers() {
  try {
    console.log('🔍 Analyzing auth.users triggers...');

    // 1. Get all triggers on auth.users table
    console.log('1. Getting all triggers on auth.users...');
    const {data: triggers, error: triggersError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          trigger_name,
          event_manipulation,
          action_timing,
          action_statement,
          action_orientation,
          action_condition
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND event_object_schema = 'auth'
        ORDER BY trigger_name;
      `,
    });

    if (triggersError) {
      console.error('Error getting triggers:', triggersError.message);
    } else {
      console.log('Found triggers on auth.users:');
      if (Array.isArray(triggers)) {
        triggers.forEach((trigger) => {
          console.log(`\n📌 ${trigger.trigger_name}`);
          console.log(`   Event: ${trigger.event_manipulation}`);
          console.log(`   Timing: ${trigger.action_timing}`);
          console.log(`   Statement: ${trigger.action_statement}`);
          console.log(`   Orientation: ${trigger.action_orientation}`);
          if (trigger.action_condition) {
            console.log(`   Condition: ${trigger.action_condition}`);
          }
        });
      }
    }

    // 2. Get trigger function definitions
    console.log('\n2. Getting trigger function definitions...');
    const {data: functions, error: functionsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          routine_name,
          routine_definition,
          routine_schema
        FROM information_schema.routines 
        WHERE routine_schema IN ('public', 'auth')
        AND routine_name IN (
          SELECT DISTINCT action_statement 
          FROM information_schema.triggers 
          WHERE event_object_table = 'users' 
          AND event_object_schema = 'auth'
        )
        ORDER BY routine_name;
      `,
    });

    if (functionsError) {
      console.error('Error getting functions:', functionsError.message);
    } else {
      console.log('Trigger function definitions:');
      if (Array.isArray(functions)) {
        functions.forEach((func) => {
          console.log(`\n🔧 Function: ${func.routine_schema}.${func.routine_name}`);
          console.log(`Definition:`);
          console.log(func.routine_definition);
        });
      }
    }

    // 3. Identify which triggers are ours vs Supabase built-in
    console.log('\n3. Identifying trigger ownership...');

    // Common Supabase built-in triggers
    const supabaseBuiltInTriggers = [
      'on_auth_user_created',
      'on_auth_user_updated',
      'on_auth_user_deleted',
      'handle_new_user',
      'handle_updated_user',
      'handle_deleted_user',
    ];

    // Our custom triggers (based on what we created)
    const ourTriggers = ['auth_users_refresh_trigger', 'auth_users_sync_trigger'];

    if (Array.isArray(triggers)) {
      triggers.forEach((trigger) => {
        const isSupabaseBuiltIn = supabaseBuiltInTriggers.includes(trigger.trigger_name);
        const isOurs = ourTriggers.includes(trigger.trigger_name);

        console.log(`\n📋 ${trigger.trigger_name}:`);
        if (isSupabaseBuiltIn) {
          console.log('   🏢 Supabase Built-in Trigger');
        } else if (isOurs) {
          console.log('   👤 Our Custom Trigger');
        } else {
          console.log('   ❓ Unknown/Third-party Trigger');
        }
      });
    }

    // 4. Check for problematic triggers
    console.log('\n4. Checking for potentially problematic triggers...');

    if (Array.isArray(triggers)) {
      const problematicTriggers = triggers.filter((trigger) => {
        const name = trigger.trigger_name.toLowerCase();
        const statement = trigger.action_statement?.toLowerCase() || '';

        // Look for triggers that might reference user_profiles or cause issues
        return (
          name.includes('user_profile') ||
          name.includes('profile') ||
          statement.includes('user_profiles') ||
          statement.includes('profiles') ||
          name.includes('handle_new_user') ||
          name.includes('on_auth_user_created')
        );
      });

      if (problematicTriggers.length > 0) {
        console.log('⚠️  Potentially problematic triggers found:');
        problematicTriggers.forEach((trigger) => {
          console.log(`\n🚨 ${trigger.trigger_name}`);
          console.log(`   Event: ${trigger.event_manipulation}`);
          console.log(`   Statement: ${trigger.action_statement}`);
        });
      } else {
        console.log('✅ No obviously problematic triggers found');
      }
    }

    // 5. Test disabling our triggers temporarily
    console.log('\n5. Testing trigger impact...');

    if (Array.isArray(triggers)) {
      const ourTriggerNames = triggers
        .filter((trigger) => ourTriggers.includes(trigger.trigger_name))
        .map((trigger) => trigger.trigger_name);

      if (ourTriggerNames.length > 0) {
        console.log('Temporarily disabling our triggers to test...');

        // Disable our triggers
        for (const triggerName of ourTriggerNames) {
          const {error: disableError} = await supabase.rpc('exec_sql', {
            sql: `ALTER TABLE auth.users DISABLE TRIGGER ${triggerName};`,
          });

          if (disableError) {
            console.error(`Error disabling ${triggerName}:`, disableError.message);
          } else {
            console.log(`✅ Disabled ${triggerName}`);
          }
        }

        // Test user creation with our triggers disabled
        console.log('Testing user creation with our triggers disabled...');
        try {
          const {data: testUser, error: createError} = await supabase.auth.admin.createUser({
            email: `test-no-our-triggers-${Date.now()}@example.com`,
            password: 'Test123!',
            email_confirm: true,
          });

          if (createError) {
            console.error(
              '❌ User creation still failed with our triggers disabled:',
              createError.message
            );
            console.error('   This suggests the issue is NOT with our triggers');
          } else {
            console.log('✅ User creation succeeded with our triggers disabled!');
            console.log('   This suggests our triggers MIGHT be causing the issue');

            // Clean up test user
            await supabase.auth.admin.deleteUser(testUser.user.id);
            console.log('✅ Test user cleaned up');
          }
        } catch (err) {
          console.error('❌ Exception during test:', err.message);
        }

        // Re-enable our triggers
        console.log('Re-enabling our triggers...');
        for (const triggerName of ourTriggerNames) {
          const {error: enableError} = await supabase.rpc('exec_sql', {
            sql: `ALTER TABLE auth.users ENABLE TRIGGER ${triggerName};`,
          });

          if (enableError) {
            console.error(`Error enabling ${triggerName}:`, enableError.message);
          } else {
            console.log(`✅ Re-enabled ${triggerName}`);
          }
        }
      }
    }

    console.log('\n🎯 Analysis Summary:');
    console.log('1. Check the trigger list above to see which ones are yours');
    console.log('2. Look for triggers that reference user_profiles or profiles');
    console.log('3. The test above will show if your triggers are causing the issue');
    console.log('4. If user creation works with your triggers disabled, they are the problem');
    console.log('5. If user creation still fails, the issue is with Supabase built-in triggers');
  } catch (error) {
    console.error('❌ Error analyzing triggers:', error);
  }
}

analyzeAuthTriggers();
