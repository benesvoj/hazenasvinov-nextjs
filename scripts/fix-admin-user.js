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

async function fixAdminUser() {
  console.log('🚀 Fixing admin user assignment...');

  try {
    const correctUserId = '5eafbfea-0962-42b0-8f72-4d07bc3214e7'; // vojtechbe@gmail.com
    const wrongUserId = '2c22f7a3-7848-434b-8e6f-7bf512d849b4'; // benesova.kl@gmail.com

    // Get user info
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    const correctUser = authUsers.users.find(au => au.id === correctUserId);
    const wrongUser = authUsers.users.find(au => au.id === wrongUserId);

    if (!correctUser) {
      console.error(`❌ Correct user ${correctUserId} not found`);
      return;
    }

    console.log(`📋 Target user: ${correctUser.email} (${correctUserId})`);

    // Remove admin role from wrong user in user_profiles
    if (wrongUser) {
      console.log(`\n🗑️  Removing admin role from: ${wrongUser.email}`);
      const { error: deleteProfileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', wrongUserId)
        .eq('role', 'admin');

      if (deleteProfileError) {
        console.error('❌ Error removing admin profile:', deleteProfileError);
      } else {
        console.log(`✅ Removed admin profile for ${wrongUser.email}`);
      }

      // Remove admin role from wrong user in user_roles
      const { error: deleteRoleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', wrongUserId)
        .eq('role', 'admin');

      if (deleteRoleError) {
        console.error('❌ Error removing admin role:', deleteRoleError);
      } else {
        console.log(`✅ Removed admin role for ${wrongUser.email}`);
      }
    }

    // Create admin profile for correct user
    console.log(`\n🔧 Creating admin profile for: ${correctUser.email}`);
    const { error: insertError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: correctUserId,
        role: 'admin',
        assigned_categories: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('❌ Error creating admin profile:', insertError);
      return;
    }

    console.log(`✅ Created admin profile for ${correctUser.email}`);

    // Assign admin role in new system
    console.log(`\n🔧 Assigning admin role in new system for: ${correctUser.email}`);
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: correctUserId,
        role: 'admin',
        created_by: correctUserId
      });

    if (roleError) {
      console.error('❌ Error assigning admin role:', roleError);
      return;
    }

    console.log(`✅ Assigned admin role for ${correctUser.email}`);

    console.log('\n🎉 Admin user fixed successfully!');
    console.log(`✅ ${correctUser.email} is now the admin user`);
    console.log('\n🎯 Next steps:');
    console.log('   1. Go to /admin/user-roles to manage user roles');
    console.log('   2. Assign coach roles to users as needed');
    console.log('   3. Assign categories to coaches');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
fixAdminUser();
