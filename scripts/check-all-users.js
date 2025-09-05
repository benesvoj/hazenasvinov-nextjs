const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllUsers() {
  console.log('🔍 Checking all users in the system...');
  console.log('=' .repeat(60));

  try {
    // 1. Check user_role_summary view
    console.log('\n📊 Checking user_role_summary view...');
    const { data: summaryUsers, error: summaryError } = await supabase
      .from('user_role_summary')
      .select('*');

    if (summaryError) {
      console.log('❌ Error fetching from user_role_summary:', summaryError.message);
    } else {
      console.log(`✅ Found ${summaryUsers.length} users in user_role_summary:`);
      summaryUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.profile_role || 'No role'})`);
      });
    }

    // 2. Check user_profiles table
    console.log('\n📋 Checking user_profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profilesError) {
      console.log('❌ Error fetching from user_profiles:', profilesError.message);
    } else {
      console.log(`✅ Found ${profiles.length} profiles in user_profiles:`);
      profiles.forEach(profile => {
        console.log(`   - User ID: ${profile.user_id} (${profile.role || 'No role'})`);
      });
    }

    // 3. Check user_roles table
    console.log('\n🎭 Checking user_roles table...');
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) {
      console.log('❌ Error fetching from user_roles:', rolesError.message);
    } else {
      console.log(`✅ Found ${roles.length} roles in user_roles:`);
      roles.forEach(role => {
        console.log(`   - User ID: ${role.user_id} (${role.role})`);
      });
    }

    // 4. Try to find vojtechbe@gmail.com specifically
    console.log('\n🔍 Looking for vojtechbe@gmail.com specifically...');
    
    // Check if there are any users with similar email
    const { data: similarUsers, error: similarError } = await supabase
      .from('user_profiles')
      .select('*')
      .ilike('user_id', '%');

    if (similarError) {
      console.log('❌ Error checking profiles:', similarError.message);
    } else {
      console.log('All user IDs in profiles:');
      similarUsers.forEach(p => console.log(`   - ${p.user_id}`));
    }

    // 5. Check if we can access auth.users through a different method
    console.log('\n🔐 Trying to access auth.users...');
    
    // Try using a function that might give us user info
    const { data: authCheck, error: authError } = await supabase
      .rpc('get_user_by_email', { email_param: 'vojtechbe@gmail.com' });

    if (authError) {
      console.log('❌ Error with get_user_by_email function:', authError.message);
    } else {
      console.log('✅ get_user_by_email result:', authCheck);
    }

    // 6. Check if the user exists by trying to create a profile
    console.log('\n🧪 Testing if user exists by checking auth...');
    
    // This is a workaround - we'll try to sign in to see if the user exists
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'vojtechbe@gmail.com',
      password: 'dummy_password' // This will fail but might give us info
    });

    if (signInError) {
      console.log('Sign in error (expected):', signInError.message);
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('✅ User exists in auth.users but wrong password');
      } else if (signInError.message.includes('User not found')) {
        console.log('❌ User does not exist in auth.users');
      } else {
        console.log('❓ Unknown error:', signInError.message);
      }
    } else {
      console.log('✅ User exists and password is correct');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkAllUsers();
