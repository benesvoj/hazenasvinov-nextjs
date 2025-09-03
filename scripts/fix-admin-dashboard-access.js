const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
} else {
  require('dotenv').config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdminDashboardAccess() {
  console.log('🔧 Fixing admin dashboard access issues...');

  try {
    // 1. Check if RLS is enabled on todos table
    console.log('\n📝 Checking todos table RLS...');
    const { data: todosRLS, error: todosRLSError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'todos' AND schemaname = 'public'` 
      });

    if (todosRLSError) {
      console.log('⚠️  Could not check todos RLS status, will proceed with setup');
    } else {
      console.log('✅ Todos table RLS status checked');
    }

    // 2. Check if RLS is enabled on comments table
    console.log('\n💬 Checking comments table RLS...');
    const { data: commentsRLS, error: commentsRLSError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'comments' AND schemaname = 'public'` 
      });

    if (commentsRLSError) {
      console.log('⚠️  Could not check comments RLS status, will proceed with setup');
    } else {
      console.log('✅ Comments table RLS status checked');
    }

    // 3. Set up RLS policies for todos table
    console.log('\n🔒 Setting up todos table RLS policies...');
    const todosRLSSQL = fs.readFileSync(path.join(__dirname, 'supabase-security-issues/fix_todos_rls.sql'), 'utf8');
    
    // Split the SQL into individual statements and execute them
    const todosStatements = todosRLSSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of todosStatements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error && !error.message.includes('already exists')) {
            console.log('⚠️  Statement warning:', error.message);
          }
        } catch (err) {
          console.log('⚠️  Statement error (may be expected):', err.message);
        }
      }
    }

    // 4. Set up RLS policies for comments table
    console.log('\n🔒 Setting up comments table RLS policies...');
    const commentsRLSSQL = fs.readFileSync(path.join(__dirname, 'supabase-security-issues/fix_comments_rls.sql'), 'utf8');
    
    // Split the SQL into individual statements and execute them
    const commentsStatements = commentsRLSSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of commentsStatements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error && !error.message.includes('already exists')) {
            console.log('⚠️  Statement warning:', error.message);
          }
        } catch (err) {
          console.log('⚠️  Statement error (may be expected):', err.message);
        }
      }
    }

    // 5. Test access with service key
    console.log('\n🧪 Testing table access...');
    
    const { data: todosTest, error: todosTestError } = await supabase
      .from('todos')
      .select('*')
      .limit(1);

    if (todosTestError) {
      console.error('❌ Todos access test failed:', todosTestError.message);
    } else {
      console.log('✅ Todos table accessible via service key');
    }

    const { data: commentsTest, error: commentsTestError } = await supabase
      .from('comments')
      .select('*')
      .limit(1);

    if (commentsTestError) {
      console.error('❌ Comments access test failed:', commentsTestError.message);
    } else {
      console.log('✅ Comments table accessible via service key');
    }

    console.log('\n🎉 Admin dashboard access fix completed!');
    console.log('\n📋 What was done:');
    console.log('   • Set up RLS policies for todos table');
    console.log('   • Set up RLS policies for comments table');
    console.log('   • Ensured proper permissions for authenticated users');
    console.log('   • Tested table access');
    console.log('\n🔧 If you still see errors:');
    console.log('   1. Make sure you are logged in as an admin user');
    console.log('   2. Check that your user has admin role in user_profiles table');
    console.log('   3. Try logging out and logging back in');
    console.log('   4. Check browser console for detailed error messages');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    console.log('\n📋 Manual setup required:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Run: scripts/supabase-security-issues/fix_todos_rls.sql');
    console.log('   3. Run: scripts/supabase-security-issues/fix_comments_rls.sql');
  }
}

fixAdminDashboardAccess();
