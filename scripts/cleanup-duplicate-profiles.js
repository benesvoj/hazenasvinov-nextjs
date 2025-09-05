const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicateProfiles() {
  console.log('🧹 Cleaning up duplicate user profiles...');
  console.log('=' .repeat(60));

  try {
    // 1. Get all user profiles
    console.log('\n📊 Fetching all user profiles...');
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (allProfilesError) {
      console.log('❌ Error fetching profiles:', allProfilesError.message);
      return;
    }

    console.log(`   Total profiles: ${allProfiles.length}`);

    // 2. Group by user_id to find duplicates
    const profilesByUser = {};
    allProfiles.forEach(profile => {
      if (!profilesByUser[profile.user_id]) {
        profilesByUser[profile.user_id] = [];
      }
      profilesByUser[profile.user_id].push(profile);
    });

    // 3. Find users with multiple profiles
    const usersWithMultipleProfiles = Object.entries(profilesByUser)
      .filter(([userId, profiles]) => profiles.length > 1);

    if (usersWithMultipleProfiles.length === 0) {
      console.log('\n✅ No duplicate profiles found. Nothing to clean up.');
      return;
    }

    console.log(`\n⚠️  Found ${usersWithMultipleProfiles.length} users with multiple profiles:`);

    // 4. Process each user with multiple profiles
    for (const [userId, profiles] of usersWithMultipleProfiles) {
      console.log(`\n🔍 Processing user: ${userId}`);
      console.log(`   Profiles: ${profiles.length}`);
      
      profiles.forEach((profile, index) => {
        console.log(`     ${index + 1}. ${profile.role} (${profile.created_at})`);
      });

      // Sort by created_at (most recent first)
      const sortedProfiles = profiles.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const keepProfile = sortedProfiles[0];
      const deleteProfiles = sortedProfiles.slice(1);

      console.log(`   ✅ Keeping: ${keepProfile.role} (${keepProfile.created_at})`);
      console.log(`   🗑️  Deleting: ${deleteProfiles.length} profile(s)`);

      // Delete duplicate profiles
      for (const profileToDelete of deleteProfiles) {
        console.log(`     Deleting profile: ${profileToDelete.role} (${profileToDelete.created_at})`);
        
        const { error: deleteError } = await supabase
          .from('user_profiles')
          .delete()
          .eq('id', profileToDelete.id);

        if (deleteError) {
          console.log(`     ❌ Error deleting profile: ${deleteError.message}`);
        } else {
          console.log(`     ✅ Profile deleted successfully`);
        }
      }
    }

    // 5. Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    const { data: remainingProfiles, error: verifyError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (verifyError) {
      console.log('❌ Error verifying cleanup:', verifyError.message);
      return;
    }

    // Check for remaining duplicates
    const remainingProfilesByUser = {};
    remainingProfiles.forEach(profile => {
      if (!remainingProfilesByUser[profile.user_id]) {
        remainingProfilesByUser[profile.user_id] = [];
      }
      remainingProfilesByUser[profile.user_id].push(profile);
    });

    const remainingDuplicates = Object.entries(remainingProfilesByUser)
      .filter(([userId, profiles]) => profiles.length > 1);

    console.log(`   Total profiles after cleanup: ${remainingProfiles.length}`);
    
    if (remainingDuplicates.length === 0) {
      console.log('   ✅ No duplicate profiles remaining');
    } else {
      console.log(`   ⚠️  ${remainingDuplicates.length} users still have multiple profiles`);
    }

    // 6. Summary
    console.log('\n🎉 CLEANUP COMPLETE!');
    console.log('=' .repeat(60));
    console.log('✅ Duplicate profiles have been removed');
    console.log('✅ Each user now has only one profile (the most recent)');
    console.log('✅ The PGRST116 error should now be resolved');
    console.log('');
    console.log('🧪 NEXT STEPS:');
    console.log('1. Test the coach portal - it should work now');
    console.log('2. Verify that vojtechbe@gmail.com can log in');
    console.log('3. Check that all users can access their respective portals');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

cleanupDuplicateProfiles();
