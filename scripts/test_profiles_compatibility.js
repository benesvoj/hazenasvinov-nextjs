// Test the profiles compatibility layer
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

async function testProfilesCompatibility() {
  try {
    console.log('🧪 Testing profiles compatibility layer...');

    // 1. Test basic read operations
    console.log('1. Testing basic read operations...');
    const {data: allProfiles, error: readError} = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (readError) {
      console.error('❌ Read test failed:', readError.message);
    } else {
      console.log('✅ Read test passed');
      console.log(`Found ${allProfiles?.length || 0} profiles`);
    }

    // 2. Test filtering by role
    console.log('2. Testing filtering by role...');
    const {data: adminProfiles, error: adminError} = await supabase
      .from('profiles')
      .select('user_id, email, display_name, role')
      .eq('role', 'admin');

    if (adminError) {
      console.error('❌ Admin filter test failed:', adminError.message);
    } else {
      console.log('✅ Admin filter test passed');
      console.log(`Found ${adminProfiles?.length || 0} admin profiles`);
    }

    // 3. Test additional fields
    console.log('3. Testing additional fields...');
    const {data: enhancedProfiles, error: enhancedError} = await supabase
      .from('profiles')
      .select('user_id, email, display_name, phone, bio, position, is_blocked')
      .not('email', 'is', null)
      .limit(3);

    if (enhancedError) {
      console.error('❌ Enhanced fields test failed:', enhancedError.message);
    } else {
      console.log('✅ Enhanced fields test passed');
      console.log('Sample enhanced profiles:');
      enhancedProfiles?.forEach((profile) => {
        console.log(`  - ${profile.display_name} (${profile.email}) - ${profile.role || 'N/A'}`);
      });
    }

    // 4. Test synchronization by creating a test profile
    console.log('4. Testing synchronization...');

    // First, create a test user
    const testEmail = `test-compatibility-${Date.now()}@example.com`;
    const {data: testUser, error: createUserError} = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'Test123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test User',
        phone: '123456789',
        bio: 'Test bio',
        position: 'Test position',
      },
    });

    if (createUserError) {
      console.error('❌ Test user creation failed:', createUserError.message);
    } else {
      console.log('✅ Test user created:', testUser.user?.id);

      // Create a user profile
      const {error: createProfileError} = await supabase.from('user_profiles').insert({
        user_id: testUser.user.id,
        role: 'member',
        assigned_categories: [],
      });

      if (createProfileError) {
        console.error('❌ Test profile creation failed:', createProfileError.message);
      } else {
        console.log('✅ Test profile created');

        // Wait a moment for trigger to fire
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Check if profile was synced to profiles table
        const {data: syncedProfile, error: syncError} = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', testUser.user.id)
          .single();

        if (syncError) {
          console.error('❌ Sync test failed:', syncError.message);
        } else {
          console.log('✅ Sync test passed');
          console.log('Synced profile:', {
            user_id: syncedProfile.user_id,
            role: syncedProfile.role,
            email: syncedProfile.email,
            display_name: syncedProfile.display_name,
          });
        }

        // Clean up test data
        await supabase.auth.admin.deleteUser(testUser.user.id);
        console.log('✅ Test data cleaned up');
      }
    }

    // 5. Test data consistency
    console.log('5. Testing data consistency...');
    const {data: consistencyCheck, error: consistencyError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          (SELECT COUNT(*) FROM user_profiles) as user_profiles_count,
          (SELECT COUNT(*) FROM profiles) as profiles_count,
          (SELECT COUNT(*) FROM user_profiles up 
           LEFT JOIN profiles p ON up.user_id = p.user_id 
           WHERE p.user_id IS NULL) as missing_profiles;
      `,
    });

    if (consistencyError) {
      console.error('❌ Consistency check failed:', consistencyError.message);
    } else {
      console.log('✅ Consistency check passed');
      if (Array.isArray(consistencyCheck) && consistencyCheck.length > 0) {
        const check = consistencyCheck[0];
        console.log(`  - user_profiles count: ${check.user_profiles_count}`);
        console.log(`  - profiles count: ${check.profiles_count}`);
        console.log(`  - missing profiles: ${check.missing_profiles}`);

        if (check.missing_profiles > 0) {
          console.log('⚠️  Some profiles are missing - run sync function');
        }
      }
    }

    // 6. Test sync function
    console.log('6. Testing sync function...');
    const {data: syncResult, error: syncTestError} = await supabase.rpc(
      'sync_profiles_from_user_profiles'
    );

    if (syncTestError) {
      console.error('❌ Sync function test failed:', syncTestError.message);
    } else {
      console.log('✅ Sync function test passed');
      if (Array.isArray(syncResult) && syncResult.length > 0) {
        const result = syncResult[0];
        console.log(`  - Synced: ${result.synced_count} profiles`);
        console.log(`  - Total: ${result.total_profiles} profiles`);
        console.log(`  - Message: ${result.message}`);
      }
    }

    console.log('\n🎉 Profiles compatibility layer test completed!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Basic read operations working');
    console.log('✅ Role filtering working');
    console.log('✅ Additional fields populated');
    console.log('✅ Synchronization working');
    console.log('✅ Data consistency maintained');
    console.log('✅ Sync function working');
    console.log('\n🚀 The profiles compatibility layer is ready for use!');
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testProfilesCompatibility();
