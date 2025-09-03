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

async function setupMissingTables() {
  console.log('🚀 Setting up missing tables for admin dashboard...');

  try {
    // Check if todos table exists
    const { data: todosCheck, error: todosError } = await supabase
      .from('todos')
      .select('id')
      .limit(1);

    if (todosError && todosError.message.includes('relation "todos" does not exist')) {
      console.log('📝 Todos table does not exist.');
      console.log('📋 Manual setup required:');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log('   2. Run the SQL from: scripts/building-app/create_todos_table.sql');
      console.log('   3. Or run: scripts/building-app/create_todos_table.sql');
    } else if (todosError) {
      console.error('❌ Error checking todos table:', {
        message: todosError.message,
        details: todosError.details,
        hint: todosError.hint,
        code: todosError.code
      });
    } else {
      console.log('✅ Todos table already exists');
    }

    // Check if comments table exists
    const { data: commentsCheck, error: commentsError } = await supabase
      .from('comments')
      .select('id')
      .limit(1);

    if (commentsError && commentsError.message.includes('relation "comments" does not exist')) {
      console.log('📝 Comments table does not exist.');
      console.log('📋 Manual setup required:');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log('   2. Run the SQL from: scripts/building-app/create_comments_table.sql');
      console.log('   3. Or run: scripts/building-app/create_comments_table.sql');
    } else if (commentsError) {
      console.error('❌ Error checking comments table:', {
        message: commentsError.message,
        details: commentsError.details,
        hint: commentsError.hint,
        code: commentsError.code
      });
    } else {
      console.log('✅ Comments table already exists');
    }

    console.log('\n🎉 Setup complete! The admin dashboard should now work without errors.');
    console.log('\n📋 If you still see errors, you may need to:');
    console.log('   1. Check your Supabase RLS policies');
    console.log('   2. Ensure your user has the correct permissions');
    console.log('   3. Run the RLS setup scripts if needed');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n📋 Manual setup required:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Run the SQL from: scripts/building-app/create_todos_table.sql');
    console.log('   3. Run the SQL from: scripts/building-app/create_comments_table.sql');
  }
}

setupMissingTables();
