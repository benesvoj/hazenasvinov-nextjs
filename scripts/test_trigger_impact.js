// Test the impact of triggers on user creation
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

async function testTriggerImpact() {
  try {
    console.log('🧪 Testing trigger impact on user creation...');

    // 1. First, let's try to get basic trigger information
    console.log('1. Getting basic trigger information...');
    const {data: basicInfo, error: basicError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          triggername,
          triggerdef
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth' 
        AND c.relname = 'users'
        LIMIT 10;
      `,
    });

    if (basicError) {
      console.error('Error getting basic trigger info:', basicError.message);
    } else {
      console.log('Basic trigger information:');
      if (Array.isArray(basicInfo)) {
        basicInfo.forEach((trigger) => {
          console.log(`- ${trigger.triggername} on ${trigger.schemaname}.${trigger.tablename}`);
        });
      } else {
        console.log('No triggers found or permission issue');
      }
    }

    // 2. Try to disable specific triggers we know might exist
    console.log('\n2. Testing specific trigger disabling...');

    const knownTriggers = [
      'on_auth_user_created',
      'handle_new_user',
      'auth_users_refresh_trigger',
      'auth_users_sync_trigger',
    ];

    for (const triggerName of knownTriggers) {
      console.log(`Testing trigger: ${triggerName}`);

      try {
        // Try to disable the trigger
        const {error: disableError} = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE auth.users DISABLE TRIGGER ${triggerName};`,
        });

        if (disableError) {
          console.log(`  ❌ Could not disable ${triggerName}: ${disableError.message}`);
        } else {
          console.log(`  ✅ Disabled ${triggerName}`);

          // Test user creation with this trigger disabled
          try {
            const {data: testUser, error: createError} = await supabase.auth.admin.createUser({
              email: `test-no-${triggerName}-${Date.now()}@example.com`,
              password: 'Test123!',
              email_confirm: true,
            });

            if (createError) {
              console.log(`  ❌ User creation still failed with ${triggerName} disabled`);
            } else {
              console.log(`  🎉 User creation SUCCEEDED with ${triggerName} disabled!`);
              console.log(`  🚨 This trigger (${triggerName}) is causing the issue!`);

              // Clean up test user
              await supabase.auth.admin.deleteUser(testUser.user.id);
              console.log(`  ✅ Test user cleaned up`);
            }
          } catch (err) {
            console.log(`  ❌ Exception during test: ${err.message}`);
          }

          // Re-enable the trigger
          const {error: enableError} = await supabase.rpc('exec_sql', {
            sql: `ALTER TABLE auth.users ENABLE TRIGGER ${triggerName};`,
          });

          if (enableError) {
            console.log(`  ❌ Could not re-enable ${triggerName}: ${enableError.message}`);
          } else {
            console.log(`  ✅ Re-enabled ${triggerName}`);
          }
        }
      } catch (err) {
        console.log(`  ❌ Exception with ${triggerName}: ${err.message}`);
      }
    }

    // 3. Try to disable ALL triggers at once
    console.log('\n3. Testing with ALL triggers disabled...');

    try {
      const {error: disableAllError} = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE auth.users DISABLE TRIGGER ALL;`,
      });

      if (disableAllError) {
        console.log(`❌ Could not disable all triggers: ${disableAllError.message}`);
      } else {
        console.log(`✅ Disabled ALL triggers`);

        // Test user creation with all triggers disabled
        try {
          const {data: testUser, error: createError} = await supabase.auth.admin.createUser({
            email: `test-no-triggers-${Date.now()}@example.com`,
            password: 'Test123!',
            email_confirm: true,
          });

          if (createError) {
            console.log(`❌ User creation still failed with ALL triggers disabled`);
            console.log(`   This suggests the issue is NOT with triggers`);
          } else {
            console.log(`🎉 User creation SUCCEEDED with ALL triggers disabled!`);
            console.log(`🚨 Triggers ARE causing the issue!`);

            // Clean up test user
            await supabase.auth.admin.deleteUser(testUser.user.id);
            console.log(`✅ Test user cleaned up`);
          }
        } catch (err) {
          console.log(`❌ Exception during test: ${err.message}`);
        }

        // Re-enable all triggers
        const {error: enableAllError} = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE auth.users ENABLE TRIGGER ALL;`,
        });

        if (enableAllError) {
          console.log(`❌ Could not re-enable all triggers: ${enableAllError.message}`);
        } else {
          console.log(`✅ Re-enabled ALL triggers`);
        }
      }
    } catch (err) {
      console.log(`❌ Exception with ALL triggers: ${err.message}`);
    }

    // 4. Check if there are any functions that might be causing issues
    console.log('\n4. Checking for problematic functions...');

    const {data: functions, error: functionsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          routine_name,
          routine_schema,
          routine_definition
        FROM information_schema.routines 
        WHERE routine_schema IN ('public', 'auth')
        AND (
          routine_definition LIKE '%user_profiles%' 
          OR routine_definition LIKE '%profiles%'
          OR routine_name LIKE '%user%'
        )
        ORDER BY routine_name;
      `,
    });

    if (functionsError) {
      console.error('Error getting functions:', functionsError.message);
    } else {
      console.log('Functions that might be causing issues:');
      if (Array.isArray(functions)) {
        functions.forEach((func) => {
          console.log(`\n🔧 ${func.routine_schema}.${func.routine_name}`);
          if (func.routine_definition) {
            const definition = func.routine_definition.substring(0, 200);
            console.log(`   Definition: ${definition}...`);
          }
        });
      }
    }

    console.log('\n🎯 Summary:');
    console.log(
      '1. If user creation works with specific triggers disabled, that trigger is the problem'
    );
    console.log('2. If user creation works with ALL triggers disabled, triggers are the problem');
    console.log('3. If user creation still fails with ALL triggers disabled, the issue is deeper');
    console.log('4. Check the functions list above for any that reference user_profiles');
  } catch (error) {
    console.error('❌ Error testing trigger impact:', error);
  }
}

testTriggerImpact();
