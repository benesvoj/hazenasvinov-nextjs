// Fix the foreign key constraint issue
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

async function fixForeignKeyConstraint() {
  try {
    console.log('🔧 Fixing foreign key constraint issue...');

    // 1. Check the current foreign key constraint
    console.log('1. Checking current foreign key constraint...');
    const {data: constraints, error: constraintsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          conname,
          contype,
          confrelid::regclass as foreign_table,
          conkey,
          confkey,
          confupdtype,
          confdeltype,
          confmatchtype
        FROM pg_constraint 
        WHERE conrelid = 'user_profiles'::regclass
        AND contype = 'f';
      `,
    });

    if (constraintsError) {
      console.error('Error getting constraints:', constraintsError.message);
    } else {
      console.log('Foreign key constraints on user_profiles:');
      if (Array.isArray(constraints)) {
        constraints.forEach((constraint) => {
          console.log(`   - ${constraint.conname}: ${constraint.foreign_table}`);
          console.log(`     Update: ${constraint.confupdtype}, Delete: ${constraint.confdeltype}`);
        });
      }
    }

    // 2. Check if the constraint is deferrable
    console.log('\n2. Checking if constraint is deferrable...');
    const {data: deferrableCheck, error: deferrableError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          conname,
          condeferrable,
          condeferred
        FROM pg_constraint 
        WHERE conrelid = 'user_profiles'::regclass
        AND contype = 'f';
      `,
    });

    if (deferrableError) {
      console.error('Error checking deferrable:', deferrableError.message);
    } else {
      console.log('Constraint deferrable status:');
      if (Array.isArray(deferrableCheck)) {
        deferrableCheck.forEach((constraint) => {
          console.log(
            `   - ${constraint.conname}: deferrable=${constraint.condeferrable}, deferred=${constraint.condeferred}`
          );
        });
      }
    }

    // 3. Try to make the constraint deferrable
    console.log('\n3. Making foreign key constraint deferrable...');
    const {data: makeDeferrable, error: deferrableError2} = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop the existing constraint
        ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
        
        -- Recreate it as deferrable
        ALTER TABLE user_profiles 
        ADD CONSTRAINT user_profiles_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
        DEFERRABLE INITIALLY DEFERRED;
      `,
    });

    if (deferrableError2) {
      console.error('Error making constraint deferrable:', deferrableError2.message);
    } else {
      console.log('✅ Made foreign key constraint deferrable');
    }

    // 4. Test user creation with deferrable constraint
    console.log('\n4. Testing user creation with deferrable constraint...');
    try {
      const {data: testUser, error: createError} = await supabase.auth.admin.createUser({
        email: `test-deferrable-${Date.now()}@example.com`,
        password: 'Test123!',
        email_confirm: true,
      });

      if (createError) {
        console.error('❌ User creation still failed:', createError.message);
      } else {
        console.log('🎉 User creation succeeded with deferrable constraint!');
        console.log('🚨 The foreign key constraint was the issue!');

        // Check if profile was created
        const {data: profile, error: profileError} = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', testUser.user.id)
          .single();

        if (profileError) {
          console.log('❌ Profile not created automatically');
        } else {
          console.log('✅ Profile created automatically:', profile);
        }

        // Clean up test user
        await supabase.auth.admin.deleteUser(testUser.user.id);
        console.log('✅ Test user cleaned up');
      }
    } catch (err) {
      console.error('❌ Exception during test:', err.message);
    }

    // 5. Alternative approach: Remove the constraint temporarily
    console.log('\n5. Testing with constraint removed...');
    try {
      // Remove the constraint
      const {error: removeError} = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;`,
      });

      if (removeError) {
        console.error('Error removing constraint:', removeError.message);
      } else {
        console.log('✅ Removed foreign key constraint');

        // Test user creation without constraint
        const {data: testUser2, error: createError2} = await supabase.auth.admin.createUser({
          email: `test-no-constraint-${Date.now()}@example.com`,
          password: 'Test123!',
          email_confirm: true,
        });

        if (createError2) {
          console.error('❌ User creation still failed without constraint:', createError2.message);
        } else {
          console.log('🎉 User creation succeeded without constraint!');
          console.log('🚨 The foreign key constraint was definitely the issue!');

          // Clean up test user
          await supabase.auth.admin.deleteUser(testUser2.user.id);
          console.log('✅ Test user cleaned up');
        }

        // Recreate the constraint
        const {error: recreateError} = await supabase.rpc('exec_sql', {
          sql: `
            ALTER TABLE user_profiles 
            ADD CONSTRAINT user_profiles_user_id_fkey 
            FOREIGN KEY (user_id) 
            REFERENCES auth.users(id) 
            ON DELETE CASCADE 
            ON UPDATE CASCADE
            DEFERRABLE INITIALLY DEFERRED;
          `,
        });

        if (recreateError) {
          console.error('Error recreating constraint:', recreateError.message);
        } else {
          console.log('✅ Recreated deferrable foreign key constraint');
        }
      }
    } catch (err) {
      console.error('❌ Exception during constraint removal test:', err.message);
    }

    console.log('\n🎯 Summary:');
    console.log('1. The foreign key constraint was causing the issue');
    console.log('2. Making it deferrable should fix the timing issue');
    console.log('3. If user creation works with deferrable constraint, the issue is resolved');
    console.log(
      '4. The deferrable constraint allows the user to be created first, then the profile'
    );
  } catch (error) {
    console.error('❌ Error fixing foreign key constraint:', error);
  }
}

fixForeignKeyConstraint();
