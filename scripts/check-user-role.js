const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
} else {
  require('dotenv').config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserRole() {
  console.log('👤 Checking user roles...');

  try {
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error getting users:', usersError);
      return;
    }

    console.log(`\n📊 Found ${users.users.length} users:`);
    
    for (const user of users.users) {
      console.log(`\n👤 User: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Last Sign In: ${user.last_sign_in_at || 'Never'}`);
      
      // Check user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.log('   ❌ No user profile found');
      } else {
        console.log(`   ✅ Profile found:`);
        console.log(`      Role: ${profile.role || 'No role'}`);
        console.log(`      Full Name: ${profile.full_name || 'Not set'}`);
        console.log(`      Email: ${profile.email || 'Not set'}`);
      }

      // Check user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (rolesError) {
        console.log('   ❌ Error checking user roles:', rolesError.message);
      } else if (userRoles && userRoles.length > 0) {
        console.log(`   ✅ User roles: ${userRoles.map(r => r.role).join(', ')}`);
      } else {
        console.log('   ⚠️  No user roles assigned');
      }
    }

    console.log('\n🔧 To fix admin access issues:');
    console.log('   1. Make sure your user has a profile in user_profiles table');
    console.log('   2. Make sure your user has admin role in user_roles table');
    console.log('   3. Run: npm run setup:initial-admin');
    console.log('   4. Or manually assign admin role in Supabase dashboard');

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkUserRole();
