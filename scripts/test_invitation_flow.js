// Test the invitation flow after fixing the functions
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

async function testInvitationFlow() {
  try {
    console.log('🧪 Testing invitation flow after function fixes...');

    // Test 1: inviteUserByEmail
    console.log('1. Testing inviteUserByEmail...');
    try {
      const {data: inviteData, error: inviteError} = await supabase.auth.admin.inviteUserByEmail(
        `test-invite-${Date.now()}@example.com`,
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

        // Check if profile was created
        const {data: profileData, error: profileError} = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', inviteData.user.id)
          .single();

        if (profileError) {
          console.error('❌ Profile not created:', profileError.message);
        } else {
          console.log('✅ Profile created successfully:', profileData);
        }

        // Clean up test user
        await supabase.auth.admin.deleteUser(inviteData.user.id);
        console.log('✅ Test user cleaned up');
      }
    } catch (err) {
      console.error('❌ Exception during invite test:', err.message);
    }

    // Test 2: createUser (still failing)
    console.log('2. Testing createUser...');
    try {
      const {data: createData, error: createError} = await supabase.auth.admin.createUser({
        email: `test-create-${Date.now()}@example.com`,
        password: 'Test123!',
        email_confirm: true,
      });

      if (createError) {
        console.error('❌ CreateUser failed:', createError.message);
        console.error('   Code:', createError.code);
        console.error('   Status:', createError.status);
      } else {
        console.log('✅ CreateUser succeeded!');
        console.log('   User ID:', createData.user?.id);

        // Clean up test user
        await supabase.auth.admin.deleteUser(createData.user.id);
        console.log('✅ Test user cleaned up');
      }
    } catch (err) {
      console.error('❌ Exception during createUser test:', err.message);
    }

    // Test 3: Check if there are other problematic functions
    console.log('3. Checking for other problematic functions...');
    const {data: functions, error: functionsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          routine_name,
          routine_schema,
          routine_definition
        FROM information_schema.routines 
        WHERE routine_schema IN ('public', 'auth')
        AND routine_definition LIKE '%user_profiles%'
        ORDER BY routine_name;
      `,
    });

    if (functionsError) {
      console.error('Error checking functions:', functionsError.message);
    } else {
      console.log('Functions that reference user_profiles:');
      console.log(functions);
    }

    // Test 4: Check if there are any triggers on auth.users
    console.log('4. Checking triggers on auth.users...');
    const {data: triggers, error: triggersError} = await supabase.rpc('exec_sql', {
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
      console.log('Triggers on auth.users:');
      console.log(triggers);
    }
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testInvitationFlow();
