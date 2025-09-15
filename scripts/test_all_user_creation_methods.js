// Test all possible user creation methods to identify the issue
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

async function testAllUserCreationMethods() {
  try {
    console.log('🧪 Testing all user creation methods...');
    console.log('Project URL:', supabaseUrl);

    // Test 1: Basic createUser
    console.log('\n1. Testing basic createUser...');
    try {
      const {data: basicData, error: basicError} = await supabase.auth.admin.createUser({
        email: `basic-${Date.now()}@test.com`,
        password: 'Test123!',
        email_confirm: true,
      });

      if (basicError) {
        console.error('❌ Basic createUser failed:', basicError.message);
        console.error('   Code:', basicError.code);
        console.error('   Status:', basicError.status);
      } else {
        console.log('✅ Basic createUser succeeded!');
        console.log('   User ID:', basicData.user?.id);
        await supabase.auth.admin.deleteUser(basicData.user.id);
      }
    } catch (err) {
      console.error('❌ Exception in basic createUser:', err.message);
    }

    // Test 2: createUser with metadata
    console.log('\n2. Testing createUser with metadata...');
    try {
      const {data: metaData, error: metaError} = await supabase.auth.admin.createUser({
        email: `meta-${Date.now()}@test.com`,
        password: 'Test123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'Test User',
          phone: '123456789',
        },
      });

      if (metaError) {
        console.error('❌ createUser with metadata failed:', metaError.message);
        console.error('   Code:', metaError.code);
        console.error('   Status:', metaError.status);
      } else {
        console.log('✅ createUser with metadata succeeded!');
        console.log('   User ID:', metaData.user?.id);
        await supabase.auth.admin.deleteUser(metaData.user.id);
      }
    } catch (err) {
      console.error('❌ Exception in createUser with metadata:', err.message);
    }

    // Test 3: inviteUserByEmail
    console.log('\n3. Testing inviteUserByEmail...');
    try {
      const {data: inviteData, error: inviteError} = await supabase.auth.admin.inviteUserByEmail(
        `invite-${Date.now()}@test.com`,
        {
          data: {
            full_name: 'Test User',
            phone: '123456789',
          },
        }
      );

      if (inviteError) {
        console.error('❌ inviteUserByEmail failed:', inviteError.message);
        console.error('   Code:', inviteError.code);
        console.error('   Status:', inviteError.status);
      } else {
        console.log('✅ inviteUserByEmail succeeded!');
        console.log('   User ID:', inviteData.user?.id);
        await supabase.auth.admin.deleteUser(inviteData.user.id);
      }
    } catch (err) {
      console.error('❌ Exception in inviteUserByEmail:', err.message);
    }

    // Test 4: Check project health
    console.log('\n4. Checking project health...');
    try {
      const {data: healthData, error: healthError} = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);

      if (healthError) {
        console.error('❌ Project health check failed:', healthError.message);
      } else {
        console.log('✅ Project health check passed');
      }
    } catch (err) {
      console.error('❌ Exception in health check:', err.message);
    }

    // Test 5: Check existing users
    console.log('\n5. Checking existing users...');
    try {
      const {data: usersData, error: usersError} = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 10,
      });

      if (usersError) {
        console.error('❌ List users failed:', usersError.message);
      } else {
        console.log('✅ List users succeeded');
        console.log('   Existing users count:', usersData.users?.length || 0);
        if (usersData.users && usersData.users.length > 0) {
          console.log('   First user email:', usersData.users[0].email);
          console.log('   First user created:', usersData.users[0].created_at);
        }
      }
    } catch (err) {
      console.error('❌ Exception in list users:', err.message);
    }

    // Test 6: Check project configuration
    console.log('\n6. Checking project configuration...');
    try {
      const {data: configData, error: configError} = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            current_database() as database_name,
            current_user as current_user,
            version() as postgres_version,
            now() as current_time;
        `,
      });

      if (configError) {
        console.error('❌ Project config check failed:', configError.message);
      } else {
        console.log('✅ Project config check passed');
        console.log('   Database:', configData);
      }
    } catch (err) {
      console.error('❌ Exception in project config check:', err.message);
    }

    console.log('\n🎯 Summary:');
    console.log('If all tests fail with "Database error creating new user",');
    console.log('this indicates a Supabase project-level issue that needs');
    console.log('to be resolved through Supabase support.');
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testAllUserCreationMethods();
