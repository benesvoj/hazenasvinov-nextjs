// Test user creation after fixing the user_profiles table
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

async function testUserCreationAfterFix() {
  try {
    console.log('🧪 Testing user creation after fixing user_profiles table...');

    // 1. Check if user_profiles table exists
    console.log('1. Checking if user_profiles table exists...');
    const {data: tableCheck, error: checkError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          table_name,
          column_name,
          data_type
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `,
    });

    if (checkError) {
      console.error('Error checking table:', checkError.message);
    } else {
      console.log('✅ user_profiles table structure:');
      console.log(tableCheck);
    }

    // 2. Check if trigger exists
    console.log('2. Checking if trigger exists...');
    const {data: triggerCheck, error: triggerError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          trigger_name,
          event_manipulation,
          action_timing,
          action_statement
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND event_object_schema = 'auth'
        AND trigger_name = 'on_auth_user_created';
      `,
    });

    if (triggerError) {
      console.error('Error checking trigger:', triggerError.message);
    } else {
      console.log('✅ Trigger status:');
      console.log(triggerCheck);
    }

    // 3. Test user creation
    console.log('3. Testing user creation...');
    const testEmail = `test-after-fix-${Date.now()}@example.com`;

    try {
      const {data: createData, error: createError} = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'Test123!',
        email_confirm: true,
      });

      if (createError) {
        console.error('❌ User creation failed:', createError.message);
        console.error('   Code:', createError.code);
        console.error('   Status:', createError.status);
      } else {
        console.log('✅ User creation succeeded!');
        console.log('   User ID:', createData.user?.id);
        console.log('   User email:', createData.user?.email);

        // 4. Check if user profile was created
        console.log('4. Checking if user profile was created...');
        const {data: profileData, error: profileError} = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', createData.user.id)
          .single();

        if (profileError) {
          console.error('❌ User profile not found:', profileError.message);
        } else {
          console.log('✅ User profile created successfully:');
          console.log('   Profile ID:', profileData.id);
          console.log('   Role:', profileData.role);
          console.log('   Created at:', profileData.created_at);
        }

        // 5. Clean up test user
        console.log('5. Cleaning up test user...');
        const {error: deleteError} = await supabase.auth.admin.deleteUser(createData.user.id);
        if (deleteError) {
          console.warn('Warning deleting test user:', deleteError.message);
        } else {
          console.log('✅ Test user cleaned up');
        }
      }
    } catch (err) {
      console.error('❌ Exception during user creation:', err.message);
    }

    // 6. Test with different approach
    console.log('6. Testing with inviteUserByEmail...');
    try {
      const {data: inviteData, error: inviteError} = await supabase.auth.admin.inviteUserByEmail(
        `invite-test-${Date.now()}@example.com`
      );

      if (inviteError) {
        console.error('❌ Invite failed:', inviteError.message);
        console.error('   Code:', inviteError.code);
        console.error('   Status:', inviteError.status);
      } else {
        console.log('✅ Invite succeeded!');
        console.log('   User ID:', inviteData.user?.id);

        // Clean up
        await supabase.auth.admin.deleteUser(inviteData.user.id);
        console.log('✅ Invite test user cleaned up');
      }
    } catch (err) {
      console.error('❌ Exception during invite test:', err.message);
    }
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testUserCreationAfterFix();
