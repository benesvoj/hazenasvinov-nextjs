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

async function setupInitialAdmin() {
  console.log('🚀 Setting up initial admin user...');

  try {
    // Get all admin users - we'll get user_profiles first, then fetch emails separately
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, role')
      .eq('role', 'admin');

    if (profilesError) {
      console.error('❌ Error fetching user profiles:', profilesError);
      return;
    }

    if (!userProfiles || userProfiles.length === 0) {
      console.log('⚠️  No admin users found in user_profiles table.');
      console.log('   Please ensure you have at least one user with role="admin" in user_profiles.');
      return;
    }

    // Get emails for these users from auth.users
    const userIds = userProfiles.map(up => up.user_id);
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    // Combine the data
    const users = userProfiles.map(profile => {
      const authUser = authUsers.users.find(au => au.id === profile.user_id);
      return {
        user_id: profile.user_id,
        full_name: authUser?.user_metadata?.full_name || authUser?.email || 'Unknown user',
        role: profile.role,
        email: authUser?.email || 'Unknown email'
      };
    });

    console.log(`📋 Found ${users.length} admin user(s):`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.full_name || user.email} (${user.user_id})`);
    });

    // Assign admin role to all existing admin users
    for (const user of users) {
      console.log(`\n🔧 Assigning admin role to ${user.full_name || user.email}...`);
      
      const { error: insertError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.user_id,
          role: 'admin',
          created_by: user.user_id // Self-assigned for initial setup
        });

      if (insertError) {
        console.error(`❌ Error assigning admin role to ${user.email}:`, insertError);
      } else {
        console.log(`✅ Successfully assigned admin role to ${user.full_name || user.email}`);
      }
    }

    console.log('\n🎉 Initial admin setup completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Go to /admin/user-roles to manage user roles');
    console.log('   2. Assign coach roles to users as needed');
    console.log('   3. Assign categories to coaches');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupInitialAdmin();
