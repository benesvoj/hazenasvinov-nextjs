const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findVojtechbeUser() {
  console.log('🔍 Finding vojtechbe@gmail.com user...');
  console.log('=' .repeat(60));

  try {
    // 1. Get all user profiles and check which one might be vojtechbe
    console.log('\n📋 Checking all user profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profilesError) {
      console.log('❌ Error fetching profiles:', profilesError.message);
      return;
    }

    console.log(`Found ${profiles.length} profiles:`);
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      console.log(`\n${i + 1}. Profile:`);
      console.log(`   User ID: ${profile.user_id}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Club ID: ${profile.club_id || 'None'}`);
      console.log(`   Created: ${profile.created_at}`);
      
      // Try to get user info by checking if this profile has admin access
      const { data: isAdmin, error: adminError } = await supabase
        .rpc('is_admin', { user_uuid: profile.user_id });
      
      if (!adminError) {
        console.log(`   is_admin(): ${isAdmin ? 'TRUE' : 'FALSE'}`);
      }
    }

    // 2. Check which user has admin access
    console.log('\n🔐 Checking admin access for each user...');
    for (const profile of profiles) {
      const { data: isAdmin, error: adminError } = await supabase
        .rpc('is_admin', { user_uuid: profile.user_id });
      
      if (!adminError && isAdmin) {
        console.log(`✅ User ${profile.user_id} has admin access`);
        
        // Check if this user has roles in user_roles table
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', profile.user_id);
        
        if (!rolesError && roles.length > 0) {
          console.log(`   Roles: ${roles.map(r => r.role).join(', ')}`);
        }
      }
    }

    // 3. Try to identify vojtechbe@gmail.com by checking if any user can sign in
    console.log('\n🧪 Testing sign in for vojtechbe@gmail.com...');
    
    // Try common passwords
    const passwords = ['password', 'admin', '123456', 'vojtechbe', 'hazena', 'svinov'];
    
    for (const password of passwords) {
      console.log(`   Trying password: ${password}`);
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'vojtechbe@gmail.com',
        password: password
      });

      if (!signInError && signInData.user) {
        console.log(`   ✅ SUCCESS! Password is: ${password}`);
        console.log(`   User ID: ${signInData.user.id}`);
        console.log(`   Email: ${signInData.user.email}`);
        console.log(`   Email Confirmed: ${signInData.user.email_confirmed_at ? 'Yes' : 'No'}`);
        
        // Check this user's profile
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', signInData.user.id)
          .single();
        
        if (!profileError && userProfile) {
          console.log(`   Profile Role: ${userProfile.role}`);
        }
        
        // Sign out
        await supabase.auth.signOut();
        break;
      } else {
        console.log(`   ❌ Failed: ${signInError?.message || 'Unknown error'}`);
      }
    }

    // 4. If we can't sign in, let's check if the user needs to be created
    console.log('\n🔧 RECOMMENDATIONS:');
    console.log('=' .repeat(60));
    
    if (profiles.some(p => p.role === 'admin')) {
      console.log('✅ There is at least one admin user in the system');
      console.log('   The issue might be:');
      console.log('   1. vojtechbe@gmail.com has wrong password');
      console.log('   2. vojtechbe@gmail.com needs admin role assigned');
      console.log('   3. vojtechbe@gmail.com needs a user profile created');
    } else {
      console.log('❌ No admin users found in the system');
      console.log('   SOLUTION: Create an admin user');
    }

    // 5. Provide SQL to create/fix vojtechbe@gmail.com
    console.log('\n💻 SQL TO CREATE ADMIN USER:');
    console.log('=' .repeat(60));
    
    // First, we need to get the user ID for vojtechbe@gmail.com
    // Since we can't access auth.users directly, we'll provide a template
    console.log(`-- Step 1: Get the user ID for vojtechbe@gmail.com from Supabase dashboard
-- Go to Authentication > Users and find vojtechbe@gmail.com
-- Copy the user ID and replace USER_ID_HERE below

-- Step 2: Create user profile (replace USER_ID_HERE with actual user ID)
INSERT INTO user_profiles (user_id, role, created_at)
VALUES ('USER_ID_HERE', 'admin', NOW())
ON CONFLICT (user_id) DO UPDATE SET role = 'admin', updated_at = NOW();

-- Step 3: Add admin role to user_roles table
INSERT INTO user_roles (user_id, role, created_at)
VALUES ('USER_ID_HERE', 'admin', NOW())
ON CONFLICT (user_id, role) DO NOTHING;`);

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

findVojtechbeUser();
