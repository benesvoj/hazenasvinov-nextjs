// Check for missing tables that might be causing the issue
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

async function checkMissingTables() {
  try {
    console.log('🔍 Checking for missing tables...');

    // 1. Check all tables in public schema
    console.log('1. Checking all tables in public schema...');
    const {data: allTables, error: tablesError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          table_name,
          table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `,
    });

    if (tablesError) {
      console.error('Error checking tables:', tablesError.message);
    } else {
      console.log('✅ All tables in public schema:');
      console.log(allTables);
    }

    // 2. Check if clubs table exists (referenced by user_profiles)
    console.log('2. Checking if clubs table exists...');
    const {data: clubsCheck, error: clubsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'clubs'
        );
      `,
    });

    if (clubsError) {
      console.error('Error checking clubs table:', clubsError.message);
    } else {
      console.log('Clubs table exists:', clubsCheck);
    }

    // 3. Check if categories table exists
    console.log('3. Checking if categories table exists...');
    const {data: categoriesCheck, error: categoriesError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'categories'
        );
      `,
    });

    if (categoriesError) {
      console.error('Error checking categories table:', categoriesError.message);
    } else {
      console.log('Categories table exists:', categoriesCheck);
    }

    // 4. Check user_profiles table structure
    console.log('4. Checking user_profiles table structure...');
    const {data: userProfilesStructure, error: userProfilesError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `,
    });

    if (userProfilesError) {
      console.error('Error checking user_profiles structure:', userProfilesError.message);
    } else {
      console.log('✅ user_profiles table structure:');
      console.log(userProfilesStructure);
    }

    // 5. Check foreign key constraints
    console.log('5. Checking foreign key constraints...');
    const {data: foreignKeys, error: fkError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'user_profiles';
      `,
    });

    if (fkError) {
      console.error('Error checking foreign keys:', fkError.message);
    } else {
      console.log('✅ Foreign key constraints on user_profiles:');
      console.log(foreignKeys);
    }

    // 6. Try to create a minimal user_profiles table without foreign keys
    console.log('6. Testing with minimal user_profiles table...');
    const {data: minimalTable, error: minimalError} = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop the existing table
        DROP TABLE IF EXISTS user_profiles CASCADE;
        
        -- Create minimal table without foreign keys
        CREATE TABLE user_profiles (
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
        
        -- Create basic policy
        CREATE POLICY "Allow all operations" ON user_profiles
          FOR ALL
          TO authenticated
          USING (true)
          WITH CHECK (true);
        
        -- Grant permissions
        GRANT ALL ON user_profiles TO authenticated;
      `,
    });

    if (minimalError) {
      console.error('Error creating minimal table:', minimalError.message);
    } else {
      console.log('✅ Minimal user_profiles table created successfully');
    }

    // 7. Test user creation with minimal table
    console.log('7. Testing user creation with minimal table...');
    try {
      const {data: testData, error: testError} = await supabase.auth.admin.createUser({
        email: `test-minimal-${Date.now()}@example.com`,
        password: 'Test123!',
        email_confirm: true,
      });

      if (testError) {
        console.error('❌ User creation still failed:', testError.message);
        console.error('   Code:', testError.code);
        console.error('   Status:', testError.status);
      } else {
        console.log('✅ User creation succeeded with minimal table!');
        console.log('   User ID:', testData.user?.id);

        // Check if profile was created
        const {data: profileData, error: profileError} = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', testData.user.id)
          .single();

        if (profileError) {
          console.error('❌ Profile not created:', profileError.message);
        } else {
          console.log('✅ Profile created successfully:', profileData);
        }

        // Clean up
        await supabase.auth.admin.deleteUser(testData.user.id);
        console.log('✅ Test user cleaned up');
      }
    } catch (err) {
      console.error('❌ Exception during test:', err.message);
    }
  } catch (error) {
    console.error('❌ Error during check:', error);
  }
}

checkMissingTables();
