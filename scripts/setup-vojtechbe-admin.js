const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupVojtechbeAdmin() {
  console.log('🔧 Setting up vojtechbe@gmail.com as admin...');
  console.log('=' .repeat(60));

  try {
    // 1. First, let's try to get the user ID by using the admin API
    console.log('\n🔍 Getting user ID for vojtechbe@gmail.com...');
    
    // We'll use a different approach - try to create a user profile for vojtechbe
    // and see if we get a foreign key constraint error that tells us the user doesn't exist
    
    // Let's try to find vojtechbe@gmail.com by checking if any existing user can sign in
    console.log('   Trying to identify vojtechbe@gmail.com user...');
    
    // We know vojtechbe@gmail.com exists but we need the user ID
    // Let's try a different approach - check if we can find the user by trying to create a profile
    // with a dummy UUID and see what error we get
    
    const dummyUserId = '00000000-0000-0000-0000-000000000000';
    
    console.log('   Attempting to create profile with dummy ID to test connection...');
    const { error: dummyError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: dummyUserId,
        role: 'admin',
        created_at: new Date().toISOString()
      });
    
    if (dummyError && dummyError.message.includes('violates foreign key constraint')) {
      console.log('   ✅ Database connection working - foreign key constraint working');
    } else if (dummyError) {
      console.log('   ❌ Unexpected error:', dummyError.message);
    } else {
      console.log('   ⚠️  No error - this is unexpected');
    }

    // 2. Let's try to find vojtechbe@gmail.com by checking all possible user IDs
    console.log('\n🔍 Checking if vojtechbe@gmail.com is one of the existing users...');
    
    // We have 6 user profiles, let's check if any of them might be vojtechbe@gmail.com
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profilesError) {
      console.log('❌ Error fetching profiles:', profilesError.message);
      return;
    }

    console.log('   Checking each user profile...');
    for (const profile of profiles) {
      console.log(`   Checking user ID: ${profile.user_id}`);
      
      // Try to sign in with this user ID (we'll use a test approach)
      // Since we can't directly get the email from user_id, let's try a different approach
      
      // Let's check if this user has admin access and if so, it might be vojtechbe
      const { data: isAdmin, error: adminError } = await supabase
        .rpc('is_admin', { user_uuid: profile.user_id });
      
      if (!adminError && isAdmin) {
        console.log(`   ✅ User ${profile.user_id} has admin access`);
        
        // This user already has admin access, so vojtechbe@gmail.com might be a different user
        // or vojtechbe@gmail.com might not have a profile yet
      }
    }

    // 3. Let's try to create a user profile for vojtechbe@gmail.com
    // We'll need to get the actual user ID first
    console.log('\n🔧 SOLUTION: Manual setup required');
    console.log('=' .repeat(60));
    
    console.log('Since we cannot directly access auth.users, you need to:');
    console.log('');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Authentication > Users');
    console.log('3. Find vojtechbe@gmail.com in the list');
    console.log('4. Copy the user ID (UUID)');
    console.log('5. Run the following SQL commands:');
    console.log('');
    console.log('-- Replace USER_ID_HERE with the actual user ID from Supabase dashboard');
    console.log('');
    console.log('-- Create user profile with admin role');
    console.log('INSERT INTO user_profiles (user_id, role, created_at)');
    console.log('VALUES (\'USER_ID_HERE\', \'admin\', NOW())');
    console.log('ON CONFLICT (user_id) DO UPDATE SET role = \'admin\', updated_at = NOW();');
    console.log('');
    console.log('-- Add admin role to user_roles table');
    console.log('INSERT INTO user_roles (user_id, role, created_at)');
    console.log('VALUES (\'USER_ID_HERE\', \'admin\', NOW())');
    console.log('ON CONFLICT (user_id, role) DO NOTHING;');
    console.log('');
    console.log('6. After running these commands, vojtechbe@gmail.com should be able to log in');
    console.log('   to both admin and coach portals');

    // 4. Alternative: Let's try to create a new user for vojtechbe@gmail.com
    console.log('\n🆕 ALTERNATIVE: Create new user for vojtechbe@gmail.com');
    console.log('=' .repeat(60));
    
    console.log('If vojtechbe@gmail.com doesn\'t exist in auth.users, you can:');
    console.log('');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Authentication > Users');
    console.log('3. Click "Add user"');
    console.log('4. Enter email: vojtechbe@gmail.com');
    console.log('5. Set a password');
    console.log('6. Copy the generated user ID');
    console.log('7. Run the SQL commands above with that user ID');

    // 5. Check current admin users
    console.log('\n👑 CURRENT ADMIN USERS:');
    console.log('=' .repeat(60));
    
    const adminProfiles = profiles.filter(p => p.role === 'admin');
    if (adminProfiles.length > 0) {
      console.log('Found admin users:');
      adminProfiles.forEach(profile => {
        console.log(`   - User ID: ${profile.user_id}`);
        console.log(`   - Role: ${profile.role}`);
        console.log(`   - Created: ${profile.created_at}`);
      });
    } else {
      console.log('❌ No admin users found!');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupVojtechbeAdmin();
