// Check triggers directly using pg_trigger system table
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

async function checkTriggersDirect() {
  try {
    console.log('🔍 Checking triggers directly...');

    // 1. Get triggers using pg_trigger
    console.log('1. Getting triggers from pg_trigger...');
    const {data: triggers, error: triggersError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          t.tgname as trigger_name,
          t.tgenabled as enabled,
          CASE t.tgtype & 2
            WHEN 0 THEN 'BEFORE'
            ELSE 'AFTER'
          END as timing,
          CASE t.tgtype & 4
            WHEN 0 THEN 'ROW'
            ELSE 'STATEMENT'
          END as level,
          CASE t.tgtype & 28
            WHEN 4 THEN 'INSERT'
            WHEN 8 THEN 'DELETE'
            WHEN 16 THEN 'UPDATE'
            WHEN 12 THEN 'INSERT OR DELETE'
            WHEN 20 THEN 'INSERT OR UPDATE'
            WHEN 24 THEN 'UPDATE OR DELETE'
            WHEN 28 THEN 'INSERT OR UPDATE OR DELETE'
          END as events,
          p.proname as function_name,
          n.nspname as schema_name
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        JOIN pg_namespace n ON p.pronamespace = n.oid
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace nc ON c.relnamespace = nc.oid
        WHERE nc.nspname = 'auth' 
        AND c.relname = 'users'
        ORDER BY t.tgname;
      `,
    });

    if (triggersError) {
      console.error('Error getting triggers:', triggersError.message);
    } else {
      console.log('Triggers on auth.users:');
      if (Array.isArray(triggers)) {
        triggers.forEach((trigger) => {
          console.log(`\n📌 ${trigger.trigger_name}`);
          console.log(`   Enabled: ${trigger.enabled}`);
          console.log(`   Timing: ${trigger.timing}`);
          console.log(`   Level: ${trigger.level}`);
          console.log(`   Events: ${trigger.events}`);
          console.log(`   Function: ${trigger.schema_name}.${trigger.function_name}`);
        });
      } else {
        console.log('No triggers found or error in query');
      }
    }

    // 2. Get function definitions for these triggers
    console.log('\n2. Getting function definitions...');
    const {data: functions, error: functionsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          p.proname as function_name,
          n.nspname as schema_name,
          pg_get_functiondef(p.oid) as definition
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.oid IN (
          SELECT t.tgfoid
          FROM pg_trigger t
          JOIN pg_class c ON t.tgrelid = c.oid
          JOIN pg_namespace nc ON c.relnamespace = nc.oid
          WHERE nc.nspname = 'auth' 
          AND c.relname = 'users'
        )
        ORDER BY p.proname;
      `,
    });

    if (functionsError) {
      console.error('Error getting functions:', functionsError.message);
    } else {
      console.log('Trigger function definitions:');
      if (Array.isArray(functions)) {
        functions.forEach((func) => {
          console.log(`\n🔧 Function: ${func.schema_name}.${func.function_name}`);
          console.log('Definition:');
          console.log(func.definition);
        });
      }
    }

    // 3. Identify which triggers are ours
    console.log('\n3. Identifying trigger ownership...');

    if (Array.isArray(triggers)) {
      triggers.forEach((trigger) => {
        const name = trigger.trigger_name.toLowerCase();
        const isOurs = name.includes('sync') || name.includes('refresh');
        const isSupabase = name.includes('auth_user') || name.includes('handle_new');

        console.log(`\n📋 ${trigger.trigger_name}:`);
        if (isOurs) {
          console.log('   👤 Our Custom Trigger');
        } else if (isSupabase) {
          console.log('   🏢 Supabase Built-in Trigger');
        } else {
          console.log('   ❓ Unknown/Third-party Trigger');
        }
      });
    }

    // 4. Test disabling all triggers temporarily
    console.log('\n4. Testing with all triggers disabled...');

    if (Array.isArray(triggers) && triggers.length > 0) {
      console.log('Disabling all triggers temporarily...');

      // Disable all triggers
      for (const trigger of triggers) {
        const {error: disableError} = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE auth.users DISABLE TRIGGER ${trigger.trigger_name};`,
        });

        if (disableError) {
          console.error(`Error disabling ${trigger.trigger_name}:`, disableError.message);
        } else {
          console.log(`✅ Disabled ${trigger.trigger_name}`);
        }
      }

      // Test user creation with all triggers disabled
      console.log('Testing user creation with all triggers disabled...');
      try {
        const {data: testUser, error: createError} = await supabase.auth.admin.createUser({
          email: `test-no-triggers-${Date.now()}@example.com`,
          password: 'Test123!',
          email_confirm: true,
        });

        if (createError) {
          console.error(
            '❌ User creation still failed with all triggers disabled:',
            createError.message
          );
          console.error('   This suggests the issue is NOT with triggers');
        } else {
          console.log('✅ User creation succeeded with all triggers disabled!');
          console.log('   This suggests triggers ARE causing the issue');

          // Clean up test user
          await supabase.auth.admin.deleteUser(testUser.user.id);
          console.log('✅ Test user cleaned up');
        }
      } catch (err) {
        console.error('❌ Exception during test:', err.message);
      }

      // Re-enable all triggers
      console.log('Re-enabling all triggers...');
      for (const trigger of triggers) {
        const {error: enableError} = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE auth.users ENABLE TRIGGER ${trigger.trigger_name};`,
        });

        if (enableError) {
          console.error(`Error enabling ${trigger.trigger_name}:`, enableError.message);
        } else {
          console.log(`✅ Re-enabled ${trigger.trigger_name}`);
        }
      }
    }

    console.log('\n🎯 Analysis Summary:');
    console.log('1. Check the trigger list above to see all triggers on auth.users');
    console.log('2. Look for triggers that reference user_profiles or profiles');
    console.log('3. The test above will show if ANY triggers are causing the issue');
    console.log('4. If user creation works with all triggers disabled, triggers are the problem');
    console.log('5. If user creation still fails, the issue is deeper in Supabase');
  } catch (error) {
    console.error('❌ Error checking triggers:', error);
  }
}

checkTriggersDirect();
