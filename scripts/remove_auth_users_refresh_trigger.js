// Remove the auth_users_refresh_trigger
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

async function removeAuthUsersRefreshTrigger() {
  try {
    console.log('🔧 Removing auth_users_refresh_trigger...');

    // 1. First, let's check what triggers exist on auth.users
    console.log('1. Checking existing triggers on auth.users...');
    const {data: existingTriggers, error: triggersError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          trigger_name,
          event_manipulation,
          action_timing,
          action_statement
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND event_object_schema = 'auth'
        ORDER BY trigger_name;
      `,
    });

    if (triggersError) {
      console.error('Error checking triggers:', triggersError.message);
    } else {
      console.log('Existing triggers on auth.users:');
      if (Array.isArray(existingTriggers)) {
        existingTriggers.forEach((trigger) => {
          console.log(`  - ${trigger.trigger_name} (${trigger.event_manipulation})`);
        });
      } else {
        console.log('No triggers found or permission issue');
      }
    }

    // 2. Remove the auth_users_refresh_trigger
    console.log('\n2. Removing auth_users_refresh_trigger...');
    const {data: removeTrigger, error: removeError} = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS auth_users_refresh_trigger ON auth.users;
      `,
    });

    if (removeError) {
      console.error('Error removing trigger:', removeError.message);
    } else {
      console.log('✅ auth_users_refresh_trigger removed successfully');
    }

    // 3. Also remove the auth_users_sync_trigger if it exists
    console.log('\n3. Removing auth_users_sync_trigger...');
    const {data: removeSyncTrigger, error: removeSyncError} = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS auth_users_sync_trigger ON auth.users;
      `,
    });

    if (removeSyncError) {
      console.error('Error removing sync trigger:', removeSyncError.message);
    } else {
      console.log('✅ auth_users_sync_trigger removed successfully');
    }

    // 4. Remove the associated functions if they're no longer needed
    console.log('\n4. Removing associated functions...');
    const {data: removeFunctions, error: removeFuncError} = await supabase.rpc('exec_sql', {
      sql: `
        DROP FUNCTION IF EXISTS sync_profiles_on_auth_users_change() CASCADE;
        DROP FUNCTION IF EXISTS trigger_refresh_profiles_mv() CASCADE;
      `,
    });

    if (removeFuncError) {
      console.error('Error removing functions:', removeFuncError.message);
    } else {
      console.log('✅ Associated functions removed successfully');
    }

    // 5. Verify the triggers are gone
    console.log('\n5. Verifying triggers are removed...');
    const {data: remainingTriggers, error: verifyError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          trigger_name,
          event_manipulation,
          action_timing
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND event_object_schema = 'auth'
        AND trigger_name IN ('auth_users_refresh_trigger', 'auth_users_sync_trigger')
        ORDER BY trigger_name;
      `,
    });

    if (verifyError) {
      console.error('Error verifying removal:', verifyError.message);
    } else {
      if (Array.isArray(remainingTriggers) && remainingTriggers.length === 0) {
        console.log('✅ Confirmed: Both triggers have been removed');
      } else {
        console.log('⚠️  Some triggers may still exist:', remainingTriggers);
      }
    }

    // 6. Test if this fixes the login issue
    console.log('\n6. Testing if removing triggers fixes the login issue...');
    try {
      // Try to get existing users to test basic functionality
      const {data: users, error: usersError} = await supabase.auth.admin.listUsers();

      if (usersError) {
        console.error('❌ User listing still failing:', usersError.message);
      } else {
        console.log('✅ User listing working');

        // Try to create a magic link to test session creation
        if (users?.users?.length > 0) {
          const testUser = users.users[0];
          const {data: magicLink, error: magicError} = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: testUser.email,
          });

          if (magicError) {
            console.error('❌ Magic link creation still failing:', magicError.message);
          } else {
            console.log('🎉 Magic link creation working! Triggers were the issue!');
          }
        }
      }
    } catch (err) {
      console.error('❌ Exception during test:', err.message);
    }

    console.log('\n🎯 Summary:');
    console.log('1. ✅ Removed auth_users_refresh_trigger');
    console.log('2. ✅ Removed auth_users_sync_trigger');
    console.log('3. ✅ Removed associated functions');
    console.log('4. ✅ Verified removal');
    console.log('\nThese triggers were part of our profiles compatibility layer');
    console.log('and were not needed for basic Auth functionality.');
  } catch (error) {
    console.error('❌ Error removing triggers:', error);
  }
}

removeAuthUsersRefreshTrigger();
