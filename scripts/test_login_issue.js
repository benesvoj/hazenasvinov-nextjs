// Test the login issue and investigate the "Database error granting user" error
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

async function testLoginIssue() {
  try {
    console.log('🔍 Testing login issue...');

    // 1. Check if we can access existing users
    console.log('1. Checking existing users...');
    const {data: users, error: usersError} = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error listing users:', usersError.message);
    } else {
      console.log(`✅ Found ${users?.users?.length || 0} existing users`);
      if (users?.users?.length > 0) {
        console.log('Sample users:');
        users.users.slice(0, 3).forEach((user) => {
          console.log(`  - ${user.email} (${user.id})`);
        });
      }
    }

    // 2. Test if we can get a specific user
    console.log('\n2. Testing user retrieval...');
    if (users?.users?.length > 0) {
      const testUser = users.users[0];
      const {data: userData, error: getUserError} = await supabase.auth.admin.getUserById(
        testUser.id
      );

      if (getUserError) {
        console.error('❌ Error getting user:', getUserError.message);
      } else {
        console.log('✅ Successfully retrieved user:', userData.user?.email);
      }
    }

    // 3. Test if we can update user metadata
    console.log('\n3. Testing user metadata update...');
    if (users?.users?.length > 0) {
      const testUser = users.users[0];
      const {error: updateError} = await supabase.auth.admin.updateUserById(testUser.id, {
        user_metadata: {
          ...testUser.user_metadata,
          test_updated: new Date().toISOString(),
        },
      });

      if (updateError) {
        console.error('❌ Error updating user metadata:', updateError.message);
      } else {
        console.log('✅ Successfully updated user metadata');
      }
    }

    // 4. Test if we can create a session (simulate login)
    console.log('\n4. Testing session creation...');
    if (users?.users?.length > 0) {
      const testUser = users.users[0];

      // Try to create a session for the user
      const {data: sessionData, error: sessionError} = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: testUser.email,
      });

      if (sessionError) {
        console.error('❌ Error creating magic link:', sessionError.message);
        console.error('   This might be related to the "Database error granting user" issue');
      } else {
        console.log('✅ Successfully created magic link');
      }
    }

    // 5. Check database connectivity for auth tables
    console.log('\n5. Checking auth tables accessibility...');
    const {data: authTables, error: authTablesError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          hasindexes,
          hasrules,
          hastriggers
        FROM pg_tables 
        WHERE schemaname = 'auth'
        ORDER BY tablename;
      `,
    });

    if (authTablesError) {
      console.error('❌ Error accessing auth tables:', authTablesError.message);
    } else {
      console.log('✅ Auth tables accessible:');
      if (Array.isArray(authTables)) {
        authTables.forEach((table) => {
          console.log(`  - ${table.schemaname}.${table.tablename}`);
        });
      }
    }

    // 6. Check for any locks on auth tables
    console.log('\n6. Checking for locks on auth tables...');
    const {data: authLocks, error: authLocksError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          l.locktype,
          l.relation::regclass as table_name,
          l.mode,
          l.granted,
          a.usename,
          a.query
        FROM pg_locks l
        LEFT JOIN pg_stat_activity a ON l.pid = a.pid
        WHERE l.relation IN (
          SELECT oid FROM pg_class 
          WHERE relnamespace = 'auth'::regnamespace
        )
        ORDER BY l.granted, l.pid;
      `,
    });

    if (authLocksError) {
      console.error('❌ Error checking auth locks:', authLocksError.message);
    } else {
      console.log('Auth table locks:');
      if (Array.isArray(authLocks)) {
        if (authLocks.length === 0) {
          console.log('✅ No locks found on auth tables');
        } else {
          authLocks.forEach((lock) => {
            console.log(`  - ${lock.table_name}: ${lock.mode} (granted: ${lock.granted})`);
          });
        }
      }
    }

    // 7. Test basic authentication flow
    console.log('\n7. Testing basic authentication flow...');
    try {
      // Try to sign in with a test user (if we have one)
      if (users?.users?.length > 0) {
        const testUser = users.users[0];
        console.log(`Attempting to sign in with: ${testUser.email}`);

        // Note: We can't actually sign in without a password, but we can test the auth flow
        const {data: signInData, error: signInError} = await supabase.auth.signInWithPassword({
          email: testUser.email,
          password: 'wrong-password', // Intentionally wrong to test error handling
        });

        if (signInError) {
          console.log('Expected sign-in error (wrong password):', signInError.message);
          if (signInError.message.includes('Database error granting user')) {
            console.log("🚨 CONFIRMED: This is the same error you're experiencing!");
          }
        }
      }
    } catch (err) {
      console.error('❌ Exception during auth flow test:', err.message);
    }

    // 8. Check if there are any problematic functions or triggers
    console.log('\n8. Checking for problematic auth functions...');
    const {data: authFunctions, error: authFunctionsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          routine_name,
          routine_schema,
          routine_definition
        FROM information_schema.routines 
        WHERE routine_schema = 'auth'
        AND routine_definition LIKE '%user%'
        ORDER BY routine_name;
      `,
    });

    if (authFunctionsError) {
      console.error('❌ Error checking auth functions:', authFunctionsError.message);
    } else {
      console.log('Auth functions:');
      if (Array.isArray(authFunctions)) {
        authFunctions.forEach((func) => {
          console.log(`  - ${func.routine_schema}.${func.routine_name}`);
        });
      }
    }

    console.log('\n🎯 Analysis Summary:');
    console.log('1. If user listing works, the basic auth service is accessible');
    console.log('2. If user retrieval works, individual user access is working');
    console.log('3. If metadata update works, user modification is working');
    console.log('4. If magic link creation fails, this confirms the "granting user" issue');
    console.log('5. If auth tables are accessible, the database connection is working');
    console.log('6. If there are locks on auth tables, this could be the cause');
    console.log('7. The "Database error granting user" suggests a session/token creation issue');
  } catch (error) {
    console.error('❌ Error testing login issue:', error);
  }
}

testLoginIssue();
