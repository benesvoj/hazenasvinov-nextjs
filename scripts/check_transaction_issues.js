// Check for transaction issues using alternative methods
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

async function checkTransactionIssues() {
  try {
    console.log('🔍 Checking for transaction issues...');

    // 1. Test basic database connectivity
    console.log('1. Testing basic database connectivity...');
    const {data: basicTest, error: basicError} = await supabase.rpc('exec_sql', {
      sql: `SELECT NOW() as current_time, version() as postgres_version;`,
    });

    if (basicError) {
      console.error('❌ Basic connectivity failed:', basicError.message);
      return;
    } else {
      console.log('✅ Basic connectivity working');
      if (Array.isArray(basicTest) && basicTest.length > 0) {
        console.log(`   Current time: ${basicTest[0].current_time}`);
        console.log(`   PostgreSQL version: ${basicTest[0].postgres_version}`);
      }
    }

    // 2. Check if we can start and commit a transaction
    console.log('\n2. Testing transaction handling...');
    try {
      // Start a transaction
      const {error: beginError} = await supabase.rpc('exec_sql', {
        sql: `BEGIN;`,
      });

      if (beginError) {
        console.error('❌ Could not start transaction:', beginError.message);
      } else {
        console.log('✅ Successfully started transaction');

        // Try to do something in the transaction
        const {error: testError} = await supabase.rpc('exec_sql', {
          sql: `SELECT 1 as test_value;`,
        });

        if (testError) {
          console.error('❌ Error in transaction:', testError.message);
        } else {
          console.log('✅ Successfully executed query in transaction');
        }

        // Commit the transaction
        const {error: commitError} = await supabase.rpc('exec_sql', {
          sql: `COMMIT;`,
        });

        if (commitError) {
          console.error('❌ Could not commit transaction:', commitError.message);
        } else {
          console.log('✅ Successfully committed transaction');
        }
      }
    } catch (err) {
      console.error('❌ Exception during transaction test:', err.message);
    }

    // 3. Check for any uncommitted changes in user_profiles
    console.log('\n3. Checking for uncommitted changes...');
    const {data: userProfilesCount, error: countError} = await supabase
      .from('user_profiles')
      .select('*', {count: 'exact', head: true});

    if (countError) {
      console.error('❌ Error counting user_profiles:', countError.message);
    } else {
      console.log(`✅ user_profiles table accessible, count: ${userProfilesCount}`);
    }

    // 4. Try to create a test record in user_profiles
    console.log('\n4. Testing user_profiles table operations...');
    try {
      const testUserId = '00000000-0000-0000-0000-000000000000';

      // Try to insert a test record
      const {error: insertError} = await supabase.from('user_profiles').insert({
        user_id: testUserId,
        role: 'member',
      });

      if (insertError) {
        console.error('❌ Could not insert test record:', insertError.message);
      } else {
        console.log('✅ Successfully inserted test record');

        // Try to delete the test record
        const {error: deleteError} = await supabase
          .from('user_profiles')
          .delete()
          .eq('user_id', testUserId);

        if (deleteError) {
          console.error('❌ Could not delete test record:', deleteError.message);
        } else {
          console.log('✅ Successfully deleted test record');
        }
      }
    } catch (err) {
      console.error('❌ Exception during user_profiles test:', err.message);
    }

    // 5. Check if there are any constraints or triggers causing issues
    console.log('\n5. Checking constraints and triggers...');
    const {data: constraints, error: constraintsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          conname,
          contype,
          confrelid::regclass as foreign_table,
          conkey,
          confkey
        FROM pg_constraint 
        WHERE conrelid = 'user_profiles'::regclass;
      `,
    });

    if (constraintsError) {
      console.error('❌ Error getting constraints:', constraintsError.message);
    } else {
      console.log('Constraints on user_profiles:');
      if (Array.isArray(constraints)) {
        constraints.forEach((constraint) => {
          console.log(`   - ${constraint.conname} (${constraint.contype})`);
        });
      }
    }

    // 6. Try to create a user with a different approach
    console.log('\n6. Testing alternative user creation approaches...');

    // Try with minimal data
    try {
      const {data: minimalUser, error: minimalError} = await supabase.auth.admin.createUser({
        email: `minimal-test-${Date.now()}@example.com`,
        password: 'Test123!',
        // No email_confirm, no user_metadata
      });

      if (minimalError) {
        console.error('❌ Minimal user creation failed:', minimalError.message);
      } else {
        console.log('🎉 Minimal user creation succeeded!');
        console.log('🚨 The issue might be with email_confirm or user_metadata');

        // Clean up
        await supabase.auth.admin.deleteUser(minimalUser.user.id);
        console.log('✅ Minimal test user cleaned up');
      }
    } catch (err) {
      console.error('❌ Exception during minimal user creation:', err.message);
    }

    // 7. Check if the issue is with the specific email domain
    console.log('\n7. Testing different email domains...');
    const testDomains = ['gmail.com', 'test.com', 'example.org'];

    for (const domain of testDomains) {
      try {
        const {data: domainUser, error: domainError} = await supabase.auth.admin.createUser({
          email: `test-${Date.now()}@${domain}`,
          password: 'Test123!',
          email_confirm: true,
        });

        if (domainError) {
          console.log(`❌ User creation failed with ${domain}: ${domainError.message}`);
        } else {
          console.log(`🎉 User creation succeeded with ${domain}!`);
          console.log(`🚨 The issue might be with specific email domains`);

          // Clean up
          await supabase.auth.admin.deleteUser(domainUser.user.id);
          console.log(`✅ Test user with ${domain} cleaned up`);
          break; // Stop testing if one works
        }
      } catch (err) {
        console.log(`❌ Exception with ${domain}: ${err.message}`);
      }
    }

    console.log('\n🎯 Summary:');
    console.log('1. If basic connectivity works, the database is accessible');
    console.log('2. If transaction handling works, there are no transaction issues');
    console.log('3. If user_profiles operations work, the table is not locked');
    console.log('4. If minimal user creation works, the issue is with specific parameters');
    console.log('5. If different email domains work, the issue might be domain-specific');
  } catch (error) {
    console.error('❌ Error checking transaction issues:', error);
  }
}

checkTransactionIssues();
