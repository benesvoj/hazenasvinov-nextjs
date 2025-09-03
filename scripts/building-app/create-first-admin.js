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

async function createFirstAdmin() {
  console.log('🚀 Creating first admin user...');

  try {
    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    if (!authUsers.users || authUsers.users.length === 0) {
      console.log('⚠️  No users found in auth.users table.');
      console.log('   Please create a user account first through the application.');
      return;
    }

    console.log(`📋 Found ${authUsers.users.length} user(s) in auth.users:`);
    authUsers.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.id})`);
    });

    // Check if any user already has admin role in user_profiles
    const { data: existingAdmins, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, role')
      .eq('role', 'admin');

    if (profilesError) {
      console.error('❌ Error checking existing admins:', profilesError);
      return;
    }

    if (existingAdmins && existingAdmins.length > 0) {
      console.log('✅ Admin users already exist in user_profiles:');
      existingAdmins.forEach(admin => {
        const user = authUsers.users.find(au => au.id === admin.user_id);
        console.log(`   - ${user?.email || admin.user_id}`);
      });
      console.log('\n🎯 Run "npm run setup:initial-admin" to assign roles in the new system.');
      return;
    }

    // Find the specific user to make admin (you can change this user ID)
    const targetUserId = '5eafbfea-0962-42b0-8f72-4d07bc3214e7'; // vojtechbe@gmail.com
    const targetUser = authUsers.users.find(user => user.id === targetUserId);
    
    if (!targetUser) {
      console.log(`❌ User with ID ${targetUserId} not found in auth.users`);
      console.log('Available users:');
      authUsers.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.id})`);
      });
      return;
    }
    
    console.log(`\n🔧 Creating admin profile for: ${targetUser.email}`);

    // Create user profile with admin role (without assigned_categories to avoid constraint violation)
    const { error: insertError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: targetUser.id,
        role: 'admin',
        assigned_categories: null, // Explicitly set to null for admin users
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('❌ Error creating admin profile:', insertError);
      return;
    }

    console.log(`✅ Successfully created admin profile for ${targetUser.email}`);
    console.log('\n🎯 Next steps:');
    console.log('   1. Run "npm run setup:initial-admin" to assign roles in the new system');
    console.log('   2. Go to /admin/user-roles to manage user roles');
    console.log('   3. Create additional admin or coach users as needed');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
createFirstAdmin();
