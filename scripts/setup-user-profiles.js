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

async function setupUserProfiles() {
  console.log('👤 Setting up user profiles...');

  try {
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error getting users:', usersError);
      return;
    }

    console.log(`\n📊 Found ${users.users.length} users to process:`);
    
    for (const user of users.users) {
      console.log(`\n👤 Processing user: ${user.email}`);
      
      // Check if profile already exists
      const { data: existingProfiles, error: profileCheckError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id);

      if (profileCheckError) {
        console.log(`   ❌ Error checking profile: ${profileCheckError.message}`);
        continue;
      }

      if (existingProfiles && existingProfiles.length > 0) {
        console.log(`   ✅ Profile already exists`);
        continue;
      }

      // Check if user has admin role
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      let userRole = 'member'; // default role (based on the constraint)
      if (!rolesError && userRoles && userRoles.length > 0) {
        userRole = userRoles[0].role; // use the first role found
      }

      // Create user profile
      const profileData = {
        user_id: user.id,
        role: userRole,
        assigned_categories: userRole === 'coach' || userRole === 'head_coach' ? [] : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single();

      if (createError) {
        console.log(`   ❌ Error creating profile: ${createError.message}`);
      } else {
        console.log(`   ✅ Profile created with role: ${userRole}`);
        console.log(`      User ID: ${profileData.user_id}`);
        console.log(`      Email: ${user.email}`);
      }
    }

    console.log('\n🎉 User profiles setup completed!');
    console.log('\n📋 What was done:');
    console.log('   • Created user profiles for all users');
    console.log('   • Assigned appropriate roles based on user_roles table');
    console.log('   • Set default values for missing profile data');
    console.log('\n✅ The admin dashboard should now work properly!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupUserProfiles();
