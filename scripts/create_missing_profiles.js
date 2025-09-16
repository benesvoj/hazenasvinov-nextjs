// Create missing user profiles for existing users
const {createClient} = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {auth: {autoRefreshToken: false, persistSession: false}}
);

async function checkAndCreateProfiles() {
  try {
    console.log('🔍 Checking existing users and profiles...');

    // Get all users
    const {data: users, error: usersError} = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('Error getting users:', usersError.message);
      return;
    }

    console.log('Found', users?.users?.length || 0, 'users:');
    users?.users?.forEach((user) => {
      console.log('  -', user.email, '(ID:', user.id, ')');
    });

    // Check existing profiles
    console.log('\n🔍 Checking existing profiles...');
    const {data: profiles, error: profilesError} = await supabase
      .from('user_profiles')
      .select('user_id, role');

    if (profilesError) {
      console.error('Error getting profiles:', profilesError.message);
    } else {
      console.log('Found', profiles?.length || 0, 'profiles:');
      profiles?.forEach((profile) => {
        console.log('  - User ID:', profile.user_id, '(Role:', profile.role, ')');
      });
    }

    // Create missing profiles
    console.log('\n🔧 Creating missing profiles...');
    const usersToCreate =
      users?.users?.filter((user) => !profiles?.some((profile) => profile.user_id === user.id)) ||
      [];

    console.log('Users needing profiles:', usersToCreate.length);

    for (const user of usersToCreate) {
      console.log('Creating profile for:', user.email);

      // Determine role based on email
      let role = 'member';
      if (user.email?.includes('admin') || user.email?.includes('vojtechbe@gmail.com')) {
        role = 'admin';
      } else if (user.email?.includes('coach') || user.email?.includes('jakub@hazenasvinov.cz')) {
        role = 'coach';
      }

      const {error: createError} = await supabase.from('user_profiles').insert({
        user_id: user.id,
        role: role,
        assigned_categories: role === 'coach' ? [] : null,
      });

      if (createError) {
        console.error('Error creating profile for', user.email, ':', createError.message);
      } else {
        console.log('✅ Created profile for', user.email, 'with role', role);
      }
    }

    console.log('\n🎯 Testing login after profile creation...');

    // Test profile fetch
    if (users?.users?.length > 0) {
      const testUser = users.users[0];
      console.log('Testing profile fetch for:', testUser.email);

      const {data: profile, error: profileError} = await supabase
        .from('user_profiles')
        .select('id, user_id, role, assigned_categories, club_id')
        .eq('user_id', testUser.id)
        .single();

      if (profileError) {
        console.error('❌ Profile fetch failed:', profileError.message);
      } else {
        console.log('✅ Profile fetch works');
        console.log('   Profile:', profile);
      }
    }
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

checkAndCreateProfiles();
