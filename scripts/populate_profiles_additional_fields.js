// Client-side function to populate additional fields in profiles table
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

async function populateProfilesAdditionalFields() {
  try {
    console.log('🔧 Populating additional fields in profiles table...');

    // 1. Get all profiles that need additional fields populated
    console.log('1. Getting profiles that need additional fields...');
    const {data: profiles, error: profilesError} = await supabase
      .from('profiles')
      .select('user_id, email, display_name')
      .or('email.is.null,display_name.is.null');

    if (profilesError) {
      console.error('Error getting profiles:', profilesError.message);
      return;
    }

    console.log(`Found ${profiles?.length || 0} profiles that need additional fields`);

    if (!profiles || profiles.length === 0) {
      console.log('✅ All profiles already have additional fields populated');
      return;
    }

    // 2. Get user data from auth.users for each profile
    console.log('2. Getting user data from auth.users...');
    let updatedCount = 0;
    let errorCount = 0;

    for (const profile of profiles) {
      try {
        // Get user data from auth.users
        const {data: userData, error: userError} = await supabase.auth.admin.getUserById(
          profile.user_id
        );

        if (userError) {
          console.error(`Error getting user data for ${profile.user_id}:`, userError.message);
          errorCount++;
          continue;
        }

        if (!userData.user) {
          console.error(`No user data found for ${profile.user_id}`);
          errorCount++;
          continue;
        }

        const user = userData.user;
        const metadata = user.user_metadata || {};

        // Update the profile with additional fields
        const {error: updateError} = await supabase
          .from('profiles')
          .update({
            email: user.email,
            display_name: metadata.full_name || user.email,
            phone: metadata.phone || null,
            bio: metadata.bio || null,
            position: metadata.position || null,
            is_blocked: metadata.is_blocked || false,
          })
          .eq('user_id', profile.user_id);

        if (updateError) {
          console.error(`Error updating profile for ${profile.user_id}:`, updateError.message);
          errorCount++;
        } else {
          updatedCount++;
          console.log(`✅ Updated profile for ${user.email}`);
        }
      } catch (err) {
        console.error(`Exception updating profile ${profile.user_id}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`✅ Successfully updated: ${updatedCount} profiles`);
    console.log(`❌ Errors: ${errorCount} profiles`);

    // 3. Verify the results
    console.log('3. Verifying results...');
    const {data: updatedProfiles, error: verifyError} = await supabase
      .from('profiles')
      .select('user_id, email, display_name, phone, bio, position, is_blocked')
      .limit(5);

    if (verifyError) {
      console.error('Error verifying results:', verifyError.message);
    } else {
      console.log('Sample updated profiles:');
      updatedProfiles?.forEach((profile) => {
        console.log(`  - ${profile.email} (${profile.display_name}) - ${profile.role}`);
      });
    }

    console.log('\n🎉 Additional fields population completed!');
    console.log('\n📋 What was populated:');
    console.log("- email: User's email address");
    console.log("- display_name: User's full name or email");
    console.log("- phone: User's phone number");
    console.log("- bio: User's bio");
    console.log("- position: User's position");
    console.log('- is_blocked: Whether user is blocked');
  } catch (error) {
    console.error('❌ Error populating additional fields:', error);
  }
}

populateProfilesAdditionalFields();
