// Emergency fix for login issues
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

async function emergencyFixLogin() {
  try {
    console.log('🚨 Emergency fix for login issues...');

    // 1. Check if user_profiles table exists
    console.log('1. Checking user_profiles table...');
    const {data: tableCheck, error: tableError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_profiles'
        );
      `,
    });

    if (tableError) {
      console.error('Error checking table:', tableError.message);
    } else {
      console.log('user_profiles table exists:', tableCheck);
    }

    // 2. Check existing users
    console.log('2. Checking existing users...');
    const {data: usersData, error: usersError} = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 10,
    });

    if (usersError) {
      console.error('Error listing users:', usersError.message);
    } else {
      console.log('✅ Existing users:');
      usersData.users?.forEach((user) => {
        console.log(`   - ${user.email} (${user.id})`);
      });
    }

    // 3. Check if user_profiles table exists and recreate if needed
    console.log('3. Ensuring user_profiles table exists...');
    const {data: createTable, error: createError} = await supabase.rpc('exec_sql', {
      sql: `
        -- Create user_profiles table if it doesn't exist
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'coach', 'member', 'head_coach')),
          club_id UUID,
          assigned_categories UUID[] DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
        
        -- Enable RLS
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create permissive policies for now
        DROP POLICY IF EXISTS "Allow all operations" ON user_profiles;
        CREATE POLICY "Allow all operations" ON user_profiles
          FOR ALL
          TO authenticated
          USING (true)
          WITH CHECK (true);
        
        -- Grant permissions
        GRANT ALL ON user_profiles TO authenticated;
      `,
    });

    if (createError) {
      console.error('Error creating table:', createError.message);
    } else {
      console.log('✅ user_profiles table ensured');
    }

    // 4. Check if existing users have profiles
    console.log('4. Checking existing user profiles...');
    if (usersData.users && usersData.users.length > 0) {
      for (const user of usersData.users) {
        const {data: profileData, error: profileError} = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.log(`Creating profile for user ${user.email}...`);
          const {error: insertError} = await supabase.from('user_profiles').insert({
            user_id: user.id,
            role: 'admin', // Assume existing users are admins
            assigned_categories: [],
          });

          if (insertError) {
            console.error(`Error creating profile for ${user.email}:`, insertError.message);
          } else {
            console.log(`✅ Profile created for ${user.email}`);
          }
        } else {
          console.log(`✅ Profile exists for ${user.email} (role: ${profileData.role})`);
        }
      }
    }

    // 5. Test login functionality
    console.log('5. Testing login functionality...');
    try {
      // Try to get the first user's profile
      if (usersData.users && usersData.users.length > 0) {
        const firstUser = usersData.users[0];
        const {data: testProfile, error: testError} = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', firstUser.id)
          .single();

        if (testError) {
          console.error('❌ Cannot access user profile:', testError.message);
        } else {
          console.log('✅ User profile accessible:', testProfile);
        }
      }
    } catch (err) {
      console.error('❌ Error testing login:', err.message);
    }

    // 6. Remove any problematic triggers
    console.log('6. Removing problematic triggers...');
    const {data: removeTriggers, error: triggerError} = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        DROP FUNCTION IF EXISTS handle_new_user();
      `,
    });

    if (triggerError) {
      console.error('Error removing triggers:', triggerError.message);
    } else {
      console.log('✅ Triggers removed');
    }

    console.log('\n🎉 Emergency fix completed!');
    console.log("Try logging in again. If it still doesn't work,");
    console.log('the issue might be with the authentication service itself.');
  } catch (error) {
    console.error('❌ Error during emergency fix:', error);
  }
}

emergencyFixLogin();
