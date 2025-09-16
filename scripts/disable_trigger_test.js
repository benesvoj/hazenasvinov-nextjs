// Test by temporarily disabling the trigger to isolate the issue
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

async function testUserCreation() {
  try {
    console.log('🧪 Testing user creation with trigger disabled...');

    // 1. Disable the trigger temporarily
    console.log('1. Disabling handle_new_user trigger...');
    const {error: disableError} = await supabase.rpc('exec_sql', {
      sql: 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;',
    });

    if (disableError) {
      console.error('Error disabling trigger:', disableError.message);
      return;
    } else {
      console.log('✅ Trigger disabled successfully');
    }

    // 2. Try to create a user directly
    console.log('2. Testing user creation...');
    const testEmail = `test-${Date.now()}@example.com`;

    const {data: createData, error: createError} = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TempPassword123!',
      email_confirm: true,
    });

    if (createError) {
      console.error('❌ User creation still failed:', createError.message);
      console.error('Error details:', {
        code: createError.code,
        status: createError.status,
      });
    } else {
      console.log('✅ User creation succeeded!');
      console.log('User ID:', createData.user?.id);
      console.log('User email:', createData.user?.email);

      // Clean up the test user
      if (createData.user?.id) {
        console.log('3. Cleaning up test user...');
        const {error: deleteError} = await supabase.auth.admin.deleteUser(createData.user.id);
        if (deleteError) {
          console.warn('Warning deleting test user:', deleteError.message);
        } else {
          console.log('✅ Test user cleaned up');
        }
      }
    }

    // 3. Re-enable the trigger
    console.log('4. Re-enabling trigger...');
    const {error: enableError} = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user();
      `,
    });

    if (enableError) {
      console.error('Error re-enabling trigger:', enableError.message);
    } else {
      console.log('✅ Trigger re-enabled successfully');
    }
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

testUserCreation();
