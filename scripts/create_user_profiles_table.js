// Create the missing user_profiles table
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

async function createUserProfilesTable() {
  try {
    console.log('🔧 Creating missing user_profiles table...');

    // 1. Check if table exists
    console.log('1. Checking if user_profiles table exists...');
    const {data: tableCheck, error: checkError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_profiles'
        );
      `,
    });

    if (checkError) {
      console.error('Error checking table existence:', checkError.message);
      return;
    }

    console.log('Table exists check result:', tableCheck);

    // 2. Create user_profiles table
    console.log('2. Creating user_profiles table...');
    const {data: createTable, error: createError} = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'coach', 'member', 'head_coach')),
          club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
          assigned_categories UUID[] DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `,
    });

    if (createError) {
      console.error('Error creating table:', createError.message);
      return;
    }

    console.log('✅ user_profiles table created successfully');

    // 3. Create indexes
    console.log('3. Creating indexes...');
    const {data: createIndexes, error: indexError} = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_club_id ON user_profiles(club_id);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_assigned_categories ON user_profiles USING GIN (assigned_categories);
      `,
    });

    if (indexError) {
      console.error('Error creating indexes:', indexError.message);
    } else {
      console.log('✅ Indexes created successfully');
    }

    // 4. Enable RLS
    console.log('4. Enabling RLS...');
    const {data: enableRLS, error: rlsError} = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
      `,
    });

    if (rlsError) {
      console.error('Error enabling RLS:', rlsError.message);
    } else {
      console.log('✅ RLS enabled successfully');
    }

    // 5. Create RLS policies
    console.log('5. Creating RLS policies...');
    const {data: createPolicies, error: policyError} = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
        DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
        DROP POLICY IF EXISTS "Admins can read all user profiles" ON user_profiles;
        DROP POLICY IF EXISTS "Admins can update any user profile" ON user_profiles;
        DROP POLICY IF EXISTS "Admins can delete user profiles" ON user_profiles;
        DROP POLICY IF EXISTS "Allow user profile creation" ON user_profiles;
        DROP POLICY IF EXISTS "Allow user profile creation via trigger" ON user_profiles;

        -- Create new policies
        CREATE POLICY "Users can read their own profile" ON user_profiles
            FOR SELECT
            TO authenticated
            USING (user_id = auth.uid());

        CREATE POLICY "Users can update their own profile" ON user_profiles
            FOR UPDATE
            TO authenticated
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());

        CREATE POLICY "Admins can read all user profiles" ON user_profiles
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM user_profiles up 
                    WHERE up.user_id = auth.uid() 
                    AND up.role = 'admin'
                )
            );

        CREATE POLICY "Admins can update any user profile" ON user_profiles
            FOR UPDATE
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM user_profiles up 
                    WHERE up.user_id = auth.uid() 
                    AND up.role = 'admin'
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM user_profiles up 
                    WHERE up.user_id = auth.uid() 
                    AND up.role = 'admin'
                )
            );

        CREATE POLICY "Admins can delete user profiles" ON user_profiles
            FOR DELETE
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM user_profiles up 
                    WHERE up.user_id = auth.uid() 
                    AND up.role = 'admin'
                )
            );

        -- Allow user profile creation (for trigger)
        CREATE POLICY "Allow user profile creation" ON user_profiles
            FOR INSERT
            TO authenticated
            WITH CHECK (true);
      `,
    });

    if (policyError) {
      console.error('Error creating policies:', policyError.message);
    } else {
      console.log('✅ RLS policies created successfully');
    }

    // 6. Grant permissions
    console.log('6. Granting permissions...');
    const {data: grantPerms, error: grantError} = await supabase.rpc('exec_sql', {
      sql: `
        GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO authenticated;
        GRANT USAGE ON SEQUENCE user_profiles_id_seq TO authenticated;
      `,
    });

    if (grantError) {
      console.error('Error granting permissions:', grantError.message);
    } else {
      console.log('✅ Permissions granted successfully');
    }

    // 7. Create the trigger function
    console.log('7. Creating handle_new_user function...');
    const {data: createFunction, error: functionError} = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Insert a new user profile with default 'member' role
          -- Set assigned_categories to NULL for non-coach roles to satisfy constraint
          INSERT INTO user_profiles (user_id, role, assigned_categories, created_at, updated_at)
          VALUES (
            NEW.id,
            'member', -- Default role for new users
            NULL,     -- Set to NULL for non-coach roles to satisfy constraint
            NOW(),
            NOW()
          );
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `,
    });

    if (functionError) {
      console.error('Error creating function:', functionError.message);
    } else {
      console.log('✅ handle_new_user function created successfully');
    }

    // 8. Create the trigger
    console.log('8. Creating trigger...');
    const {data: createTrigger, error: triggerError} = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION handle_new_user();
      `,
    });

    if (triggerError) {
      console.error('Error creating trigger:', triggerError.message);
    } else {
      console.log('✅ Trigger created successfully');
    }

    // 9. Test the setup
    console.log('9. Testing user creation...');
    try {
      const {data: testData, error: testError} = await supabase.auth.admin.createUser({
        email: `test-${Date.now()}@example.com`,
        password: 'Test123!',
        email_confirm: true,
      });

      if (testError) {
        console.error('❌ User creation test failed:', testError.message);
      } else {
        console.log('✅ User creation test succeeded!');
        console.log('   User ID:', testData.user?.id);

        // Clean up test user
        await supabase.auth.admin.deleteUser(testData.user.id);
        console.log('✅ Test user cleaned up');
      }
    } catch (err) {
      console.error('❌ Exception during user creation test:', err.message);
    }

    console.log('\n🎉 user_profiles table setup completed!');
    console.log('You should now be able to create users via the admin panel.');
  } catch (error) {
    console.error('❌ Error during setup:', error);
  }
}

createUserProfilesTable();
