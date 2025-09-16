// Check if we can recover any data from the user_profiles table
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

async function checkDataRecovery() {
  try {
    console.log('🔍 Checking for data recovery options...');

    // 1. Check if there are any backups or audit logs
    console.log('1. Checking for audit logs...');
    const {data: auditLogs, error: auditError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE tablename = 'user_profiles';
      `,
    });

    if (auditError) {
      console.error('Error checking audit logs:', auditError.message);
    } else {
      console.log('Audit information:', auditLogs);
    }

    // 2. Check if there are any other tables that might have user role information
    console.log('2. Checking for other tables with user information...');
    const {data: otherTables, error: otherError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          table_name,
          column_name,
          data_type
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND (column_name LIKE '%user%' OR column_name LIKE '%role%' OR column_name LIKE '%admin%')
        ORDER BY table_name, column_name;
      `,
    });

    if (otherError) {
      console.error('Error checking other tables:', otherError.message);
    } else {
      console.log('Other tables with user information:');
      console.log(otherTables);
    }

    // 3. Check if there are any functions that might have stored user role information
    console.log('3. Checking for functions with user role information...');
    const {data: functions, error: functionsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          routine_name,
          routine_definition
        FROM information_schema.routines 
        WHERE routine_schema = 'public'
        AND routine_definition LIKE '%admin%'
        ORDER BY routine_name;
      `,
    });

    if (functionsError) {
      console.error('Error checking functions:', functionsError.message);
    } else {
      console.log('Functions with admin information:');
      console.log(functions);
    }

    // 4. Check if there are any views that might have user information
    console.log('4. Checking for views with user information...');
    const {data: views, error: viewsError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          table_name,
          view_definition
        FROM information_schema.views 
        WHERE table_schema = 'public'
        AND view_definition LIKE '%user%'
        ORDER BY table_name;
      `,
    });

    if (viewsError) {
      console.error('Error checking views:', viewsError.message);
    } else {
      console.log('Views with user information:');
      console.log(views);
    }

    // 5. Check if there are any other references to user roles in the database
    console.log('5. Checking for other user role references...');
    const {data: roleRefs, error: roleError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          table_name,
          column_name,
          data_type
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND (data_type = 'text' OR data_type = 'varchar')
        AND column_name IN ('role', 'user_role', 'admin_role', 'permissions')
        ORDER BY table_name;
      `,
    });

    if (roleError) {
      console.error('Error checking role references:', roleError.message);
    } else {
      console.log('Role references found:');
      console.log(roleRefs);
    }

    // 6. Check if there are any constraints that might give us clues about the original structure
    console.log('6. Checking constraints for clues...');
    const {data: constraints, error: constraintError} = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          conname,
          contype,
          pg_get_constraintdef(oid) as definition
        FROM pg_constraint 
        WHERE conrelid = 'user_profiles'::regclass;
      `,
    });

    if (constraintError) {
      console.error('Error checking constraints:', constraintError.message);
    } else {
      console.log('Constraints on user_profiles:');
      console.log(constraints);
    }

    console.log('\n💡 Recovery suggestions:');
    console.log('1. Check if you have any database backups');
    console.log('2. Check if there are any other tables with user role information');
    console.log('3. Check if there are any application logs that might show the original data');
    console.log('4. Check if there are any other systems that might have user role information');
  } catch (error) {
    console.error('❌ Error during data recovery check:', error);
  }
}

checkDataRecovery();
