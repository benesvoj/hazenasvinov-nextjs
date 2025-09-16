// Restore user roles based on email patterns and common admin users
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

async function restoreUserRoles() {
  try {
    console.log('🔧 Restoring user roles...');

    // Get all existing users
    const {data: usersData, error: usersError} = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (usersError) {
      console.error('Error getting users:', usersError.message);
      return;
    }

    console.log('Found users:', usersData.users.length);

    // Define role assignments based on email patterns
    const roleAssignments = {
      'vojtechbe@gmail.com': 'admin', // Likely main admin
      'hazena@vojtechbenes.cz': 'admin', // Likely admin
      'zbynek.planka@seznam.cz': 'admin', // Likely admin
      'jakub@hazenasvinov.cz': 'coach', // Likely coach
      'benesova.kl@gmail.com': 'coach', // Likely coach
    };

    // Update user profiles with appropriate roles
    for (const user of usersData.users) {
      const assignedRole = roleAssignments[user.email] || 'member';

      console.log(`Updating ${user.email} to role: ${assignedRole}`);

      const {error: updateError} = await supabase
        .from('user_profiles')
        .update({
          role: assignedRole,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error(`Error updating ${user.email}:`, updateError.message);
      } else {
        console.log(`✅ Updated ${user.email} to ${assignedRole}`);
      }
    }

    // Show final user roles
    console.log('\n📋 Final user roles:');
    const {data: finalProfiles, error: finalError} = await supabase
      .from('user_profiles')
      .select('user_id, role')
      .order('role', {ascending: true});

    if (finalError) {
      console.error('Error getting final profiles:', finalError.message);
    } else {
      for (const profile of finalProfiles) {
        const user = usersData.users.find((u) => u.id === profile.user_id);
        console.log(`   ${user?.email || 'Unknown'}: ${profile.role}`);
      }
    }

    console.log('\n🎉 User roles restored!');
    console.log('You can now log in and adjust roles as needed through the admin panel.');
  } catch (error) {
    console.error('❌ Error during role restoration:', error);
  }
}

restoreUserRoles();
