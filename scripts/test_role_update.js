// Test role update functionality
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

async function testRoleUpdate() {
  try {
    console.log('🧪 Testing role update functionality...');

    // 1. Get a test user
    const {data: usersData, error: usersError} = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (usersError) {
      console.error('Error getting users:', usersError.message);
      return;
    }

    if (!usersData.users || usersData.users.length === 0) {
      console.error('No users found');
      return;
    }

    const testUser = usersData.users[0];
    console.log('Testing with user:', testUser.email);

    // 2. Test updating role
    console.log('Testing role update...');
    const {error: updateError} = await supabase
      .from('user_profiles')
      .update({
        role: 'coach',
        assigned_categories: ['test-category-id'],
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', testUser.id);

    if (updateError) {
      console.error('❌ Role update failed:', updateError.message);
      console.error('Error details:', updateError);
    } else {
      console.log('✅ Role update succeeded!');
    }

    // 3. Test updating with null categories
    console.log('Testing role update with null categories...');
    const {error: updateError2} = await supabase
      .from('user_profiles')
      .update({
        role: 'admin',
        assigned_categories: [],
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', testUser.id);

    if (updateError2) {
      console.error('❌ Role update with null categories failed:', updateError2.message);
    } else {
      console.log('✅ Role update with null categories succeeded!');
    }

    // 4. Check the final state
    console.log('Checking final user profile...');
    const {data: finalProfile, error: finalError} = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', testUser.id)
      .single();

    if (finalError) {
      console.error('Error getting final profile:', finalError.message);
    } else {
      console.log('✅ Final profile:', finalProfile);
    }
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testRoleUpdate();
