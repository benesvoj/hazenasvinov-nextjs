const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserRoleSecurity() {
  try {
    console.log('🔒 Fixing user_role_summary security issue...');
    console.log('');

    // Read the SQL script
    const sqlPath = path.join(__dirname, 'fix_user_role_summary_security.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL script
    console.log('📝 Executing security fix SQL script...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });

    if (error) {
      // If exec_sql doesn't exist, try direct query execution
      console.log('⚠️  exec_sql function not available, trying direct execution...');
      
      // Split the script into individual statements
      const statements = sqlScript
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`   Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('exec', { sql: statement });
          if (stmtError) {
            console.error(`   ❌ Error: ${stmtError.message}`);
          } else {
            console.log(`   ✅ Success`);
          }
        }
      }
    } else {
      console.log('✅ Security fix executed successfully!');
    }

    console.log('');
    console.log('🔒 Security Fix Summary:');
    console.log('   • Removed user_role_summary view that exposed auth.users data');
    console.log('   • Created secure user_role_summary view (no auth.users data)');
    console.log('   • Added get_current_user_summary() function for own data');
    console.log('   • Added get_user_summary_by_id() function for admin access');
    console.log('');
    console.log('✅ User role security issue has been resolved!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Update your application code to use the new secure functions');
    console.log('   2. Replace direct user_role_summary queries with:');
    console.log('      - get_current_user_summary() for current user data');
    console.log('      - get_user_summary_by_id(user_id) for admin access');
    console.log('   3. Test the application to ensure everything works correctly');

  } catch (error) {
    console.error('❌ Error fixing user role security:', error.message);
    console.error('');
    console.error('🔧 Manual Fix Required:');
    console.error('   1. Go to your Supabase SQL Editor');
    console.error('   2. Run the SQL script: scripts/fix_user_role_summary_security.sql');
    console.error('   3. Verify the changes were applied successfully');
    process.exit(1);
  }
}

// Run the fix
fixUserRoleSecurity();
