// Fix user creation RLS conflict using Supabase client
// This script applies the database fix to resolve user creation issues

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

async function fixUserCreation() {
  try {
    console.log('🔧 Fixing user creation RLS conflict...');

    // 1. Drop the problematic RLS policy
    console.log('1. Dropping problematic RLS policy...');
    const {error: dropError} = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Admins can insert user profiles" ON user_profiles;',
    });

    if (dropError) {
      console.warn('Warning dropping policy:', dropError.message);
    } else {
      console.log('✅ Policy dropped successfully');
    }

    // 2. Fix the handle_new_user function
    console.log('2. Updating handle_new_user function...');
    const {error: functionError} = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Insert a new user profile with default 'member' role
          -- Set assigned_categories to NULL for non-coach roles to satisfy the constraint
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
      console.error('Error updating function:', functionError.message);
      return;
    } else {
      console.log('✅ Function updated successfully');
    }

    // 3. Create a permissive policy for user profile creation
    console.log('3. Creating permissive policy...');
    const {error: policyError} = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow user profile creation" ON user_profiles
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
      `,
    });

    if (policyError) {
      console.error('Error creating policy:', policyError.message);
      return;
    } else {
      console.log('✅ Policy created successfully');
    }

    // 4. Grant necessary permissions
    console.log('4. Granting permissions...');
    const {error: grantError} = await supabase.rpc('exec_sql', {
      sql: 'GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;',
    });

    if (grantError) {
      console.warn('Warning granting permissions:', grantError.message);
    } else {
      console.log('✅ Permissions granted successfully');
    }

    console.log('🎉 User creation fix applied successfully!');
    console.log('You can now try creating a user again.');
  } catch (error) {
    console.error('❌ Error applying fix:', error.message);
    process.exit(1);
  }
}

// Check if exec_sql function exists, if not create it
async function checkExecSqlFunction() {
  try {
    const {data, error} = await supabase.rpc('exec_sql', {
      sql: 'SELECT 1;',
    });

    if (error && error.message.includes('function exec_sql')) {
      console.log('Creating exec_sql function...');
      const {error: createError} = await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION exec_sql(sql text)
          RETURNS text
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql;
            RETURN 'OK';
          END;
          $$;
        `,
      });

      if (createError) {
        console.error('Error creating exec_sql function:', createError.message);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking exec_sql function:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting user creation fix...');

  const hasExecSql = await checkExecSqlFunction();
  if (!hasExecSql) {
    console.error('❌ Cannot proceed without exec_sql function');
    process.exit(1);
  }

  await fixUserCreation();
}

main();
