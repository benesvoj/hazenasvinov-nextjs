// Check for open transactions that might be blocking user creation
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

async function checkOpenTransactions() {
  try {
    console.log('🔍 Checking for open transactions...');

    // 1. Check for active connections and transactions
    console.log('1. Checking active connections and transactions...');
    const {data: activeConnections, error: connectionsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          pid,
          usename,
          application_name,
          client_addr,
          state,
          query_start,
          state_change,
          query
        FROM pg_stat_activity 
        WHERE state != 'idle'
        AND pid != pg_backend_pid()
        ORDER BY query_start DESC;
      `,
    });

    if (connectionsError) {
      console.error('Error getting active connections:', connectionsError.message);
    } else {
      console.log('Active connections:');
      if (Array.isArray(activeConnections)) {
        if (activeConnections.length === 0) {
          console.log('✅ No active connections found');
        } else {
          activeConnections.forEach((conn) => {
            console.log(`\n📌 PID ${conn.pid}:`);
            console.log(`   User: ${conn.usename}`);
            console.log(`   App: ${conn.application_name}`);
            console.log(`   State: ${conn.state}`);
            console.log(`   Started: ${conn.query_start}`);
            console.log(`   Query: ${conn.query?.substring(0, 100)}...`);
          });
        }
      }
    }

    // 2. Check for locks on auth.users table
    console.log('\n2. Checking locks on auth.users table...');
    const {data: locks, error: locksError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          l.locktype,
          l.database,
          l.relation::regclass as table_name,
          l.page,
          l.tuple,
          l.virtualxid,
          l.transactionid,
          l.classid,
          l.objid,
          l.objsubid,
          l.virtualtransaction,
          l.pid,
          l.mode,
          l.granted,
          a.usename,
          a.query,
          a.query_start,
          a.state
        FROM pg_locks l
        LEFT JOIN pg_stat_activity a ON l.pid = a.pid
        WHERE l.relation = 'auth.users'::regclass
        ORDER BY l.granted, l.pid;
      `,
    });

    if (locksError) {
      console.error('Error getting locks:', locksError.message);
    } else {
      console.log('Locks on auth.users:');
      if (Array.isArray(locks)) {
        if (locks.length === 0) {
          console.log('✅ No locks found on auth.users table');
        } else {
          locks.forEach((lock) => {
            console.log(`\n🔒 Lock on auth.users:`);
            console.log(`   PID: ${lock.pid}`);
            console.log(`   Mode: ${lock.mode}`);
            console.log(`   Granted: ${lock.granted}`);
            console.log(`   User: ${lock.usename}`);
            console.log(`   Query: ${lock.query?.substring(0, 100)}...`);
            console.log(`   Started: ${lock.query_start}`);
          });
        }
      }
    }

    // 3. Check for long-running transactions
    console.log('\n3. Checking for long-running transactions...');
    const {data: longTransactions, error: longTxError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          pid,
          usename,
          application_name,
          state,
          query_start,
          now() - query_start as duration,
          query
        FROM pg_stat_activity 
        WHERE state IN ('active', 'idle in transaction', 'idle in transaction (aborted)')
        AND now() - query_start > interval '30 seconds'
        ORDER BY duration DESC;
      `,
    });

    if (longTxError) {
      console.error('Error getting long transactions:', longTxError.message);
    } else {
      console.log('Long-running transactions (>30s):');
      if (Array.isArray(longTransactions)) {
        if (longTransactions.length === 0) {
          console.log('✅ No long-running transactions found');
        } else {
          longTransactions.forEach((tx) => {
            console.log(`\n⏰ Long transaction:`);
            console.log(`   PID: ${tx.pid}`);
            console.log(`   User: ${tx.usename}`);
            console.log(`   Duration: ${tx.duration}`);
            console.log(`   State: ${tx.state}`);
            console.log(`   Query: ${tx.query?.substring(0, 100)}...`);
          });
        }
      }
    }

    // 4. Check for blocked queries
    console.log('\n4. Checking for blocked queries...');
    const {data: blockedQueries, error: blockedError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          blocked_locks.pid AS blocked_pid,
          blocked_activity.usename AS blocked_user,
          blocking_locks.pid AS blocking_pid,
          blocking_activity.usename AS blocking_user,
          blocked_activity.query AS blocked_statement,
          blocking_activity.query AS current_statement_in_blocking_process
        FROM pg_catalog.pg_locks blocked_locks
        JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
        JOIN pg_catalog.pg_locks blocking_locks 
          ON blocking_locks.locktype = blocked_locks.locktype
          AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
          AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
          AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
          AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
          AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
          AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
          AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
          AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
          AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
          AND blocking_locks.pid != blocked_locks.pid
        JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
        WHERE NOT blocked_locks.granted;
      `,
    });

    if (blockedError) {
      console.error('Error getting blocked queries:', blockedError.message);
    } else {
      console.log('Blocked queries:');
      if (Array.isArray(blockedQueries)) {
        if (blockedQueries.length === 0) {
          console.log('✅ No blocked queries found');
        } else {
          blockedQueries.forEach((blocked) => {
            console.log(`\n🚫 Blocked query:`);
            console.log(`   Blocked PID: ${blocked.blocked_pid}`);
            console.log(`   Blocked User: ${blocked.blocked_user}`);
            console.log(`   Blocking PID: ${blocked.blocking_pid}`);
            console.log(`   Blocking User: ${blocked.blocking_user}`);
            console.log(`   Blocked Statement: ${blocked.blocked_statement?.substring(0, 100)}...`);
            console.log(
              `   Blocking Statement: ${blocked.current_statement_in_blocking_process?.substring(0, 100)}...`
            );
          });
        }
      }
    }

    // 5. Check for prepared transactions
    console.log('\n5. Checking for prepared transactions...');
    const {data: preparedTx, error: preparedError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          gid,
          prepared,
          owner,
          database
        FROM pg_prepared_xacts;
      `,
    });

    if (preparedError) {
      console.error('Error getting prepared transactions:', preparedError.message);
    } else {
      console.log('Prepared transactions:');
      if (Array.isArray(preparedTx)) {
        if (preparedTx.length === 0) {
          console.log('✅ No prepared transactions found');
        } else {
          preparedTx.forEach((tx) => {
            console.log(`\n📋 Prepared transaction:`);
            console.log(`   GID: ${tx.gid}`);
            console.log(`   Prepared: ${tx.prepared}`);
            console.log(`   Owner: ${tx.owner}`);
            console.log(`   Database: ${tx.database}`);
          });
        }
      }
    }

    // 6. Try to terminate any problematic connections
    console.log('\n6. Checking if we can terminate problematic connections...');

    if (Array.isArray(activeConnections) && activeConnections.length > 0) {
      console.log('Found active connections. Attempting to terminate them...');

      for (const conn of activeConnections) {
        if (conn.pid && conn.state !== 'idle') {
          try {
            const {error: terminateError} = await supabase.rpc('exec_sql', {
              sql: `SELECT pg_terminate_backend(${conn.pid});`,
            });

            if (terminateError) {
              console.log(`❌ Could not terminate PID ${conn.pid}: ${terminateError.message}`);
            } else {
              console.log(`✅ Terminated PID ${conn.pid}`);
            }
          } catch (err) {
            console.log(`❌ Exception terminating PID ${conn.pid}: ${err.message}`);
          }
        }
      }
    }

    // 7. Test user creation after cleanup
    console.log('\n7. Testing user creation after cleanup...');
    try {
      const {data: testUser, error: createError} = await supabase.auth.admin.createUser({
        email: `test-after-cleanup-${Date.now()}@example.com`,
        password: 'Test123!',
        email_confirm: true,
      });

      if (createError) {
        console.error('❌ User creation still failed after cleanup:', createError.message);
      } else {
        console.log('🎉 User creation SUCCEEDED after cleanup!');
        console.log('🚨 Open transactions were causing the issue!');

        // Clean up test user
        await supabase.auth.admin.deleteUser(testUser.user.id);
        console.log('✅ Test user cleaned up');
      }
    } catch (err) {
      console.error('❌ Exception during test:', err.message);
    }

    console.log('\n🎯 Summary:');
    console.log('1. Check the active connections above for any long-running queries');
    console.log('2. Check the locks above for any blocking locks on auth.users');
    console.log('3. Check the blocked queries above for any deadlocks');
    console.log('4. If user creation works after cleanup, open transactions were the problem');
    console.log('5. If user creation still fails, the issue is deeper in Supabase');
  } catch (error) {
    console.error('❌ Error checking open transactions:', error);
  }
}

checkOpenTransactions();
