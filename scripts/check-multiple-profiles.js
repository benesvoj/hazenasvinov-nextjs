const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMultipleProfiles() {
  console.log('🔍 Checking for multiple user profiles...');
  console.log('=' .repeat(60));

  try {
    // 1. Check all user profiles
    console.log('\n📊 All user profiles:');
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (allProfilesError) {
      console.log('❌ Error fetching profiles:', allProfilesError.message);
      return;
    }

    console.log(`   Total profiles: ${allProfiles.length}`);
    
    // Group by user_id to find duplicates
    const profilesByUser = {};
    allProfiles.forEach(profile => {
      if (!profilesByUser[profile.user_id]) {
        profilesByUser[profile.user_id] = [];
      }
      profilesByUser[profile.user_id].push(profile);
    });

    // Find users with multiple profiles
    const usersWithMultipleProfiles = Object.entries(profilesByUser)
      .filter(([userId, profiles]) => profiles.length > 1);

    if (usersWithMultipleProfiles.length > 0) {
      console.log('\n⚠️  Users with multiple profiles:');
      usersWithMultipleProfiles.forEach(([userId, profiles]) => {
        console.log(`   User ID: ${userId}`);
        profiles.forEach((profile, index) => {
          console.log(`     Profile ${index + 1}: ${profile.role} (${profile.created_at})`);
        });
      });
    } else {
      console.log('\n✅ No users with multiple profiles found');
    }

    // 2. Check vojtechbe@gmail.com specifically
    console.log('\n🔍 Checking vojtechbe@gmail.com...');
    
    // Try to sign in to get user ID
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'vojtechbe@gmail.com',
      password: 'dummy_password' // This will fail but might give us info
    });

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('   ✅ vojtechbe@gmail.com exists in auth.users');
        
        // Find the user ID by checking all profiles and matching with auth.users
        console.log('   Looking for vojtechbe@gmail.com in profiles...');
        
        // We need to get the user ID from auth.users
        // Let's check if there are any profiles that might belong to vojtechbe@gmail.com
        const { data: authUsers, error: authError } = await supabase
          .from('auth.users')
          .select('id, email')
          .eq('email', 'vojtechbe@gmail.com');

        if (authError) {
          console.log('   ❌ Cannot access auth.users:', authError.message);
        } else if (authUsers && authUsers.length > 0) {
          const vojtechbeUserId = authUsers[0].id;
          console.log(`   User ID: ${vojtechbeUserId}`);
          
          // Check profiles for this user
          const vojtechbeProfiles = allProfiles.filter(p => p.user_id === vojtechbeUserId);
          console.log(`   Profiles found: ${vojtechbeProfiles.length}`);
          
          vojtechbeProfiles.forEach((profile, index) => {
            console.log(`     Profile ${index + 1}: ${profile.role} (${profile.created_at})`);
          });
          
          if (vojtechbeProfiles.length > 1) {
            console.log('   ⚠️  vojtechbe@gmail.com has multiple profiles!');
            console.log('   This is likely causing the PGRST116 error.');
          } else if (vojtechbeProfiles.length === 0) {
            console.log('   ❌ vojtechbe@gmail.com has no profiles');
          } else {
            console.log('   ✅ vojtechbe@gmail.com has exactly one profile');
          }
        }
      } else {
        console.log('   ❌ vojtechbe@gmail.com not found:', signInError.message);
      }
    } else {
      console.log('   ✅ vojtechbe@gmail.com signed in successfully');
      console.log('   User ID:', signInData.user.id);
      
      // Check profiles for this user
      const vojtechbeProfiles = allProfiles.filter(p => p.user_id === signInData.user.id);
      console.log(`   Profiles found: ${vojtechbeProfiles.length}`);
      
      vojtechbeProfiles.forEach((profile, index) => {
        console.log(`     Profile ${index + 1}: ${profile.role} (${profile.created_at})`);
      });
      
      if (vojtechbeProfiles.length > 1) {
        console.log('   ⚠️  vojtechbe@gmail.com has multiple profiles!');
        console.log('   This is likely causing the PGRST116 error.');
      } else if (vojtechbeProfiles.length === 0) {
        console.log('   ❌ vojtechbe@gmail.com has no profiles');
      } else {
        console.log('   ✅ vojtechbe@gmail.com has exactly one profile');
      }
      
      // Sign out
      await supabase.auth.signOut();
    }

    // 3. Summary and recommendations
    console.log('\n📋 SUMMARY:');
    console.log('=' .repeat(60));
    
    if (usersWithMultipleProfiles.length > 0) {
      console.log('⚠️  ISSUE FOUND: Users with multiple profiles detected');
      console.log('   This causes the PGRST116 error when using .single()');
      console.log('');
      console.log('🔧 SOLUTION:');
      console.log('1. Remove duplicate profiles for each user');
      console.log('2. Keep only the most recent profile for each user');
      console.log('3. Update the code to handle multiple profiles gracefully');
    } else {
      console.log('✅ No multiple profiles detected');
      console.log('   The PGRST116 error might be caused by something else');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkMultipleProfiles();
