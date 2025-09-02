const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupCoachCategories() {
  try {
    console.log('🚀 Setting up coach categories system...');

    // Read the SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, 'add_assigned_categories_simple.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      console.log('📝 Manual setup required:');
      console.log('   1. Go to your Supabase Dashboard');
      console.log('   2. Open SQL Editor');
      console.log('   3. Copy and paste the contents of scripts/add_assigned_categories_simple.sql');
      console.log('   4. Execute the SQL');
      return;
    }

    console.log('✅ Coach categories system setup completed successfully!');
    console.log('');
    console.log('📋 What was added:');
    console.log('   • assigned_categories column to user_profiles table');
    console.log('   • Index for better performance');
    console.log('   • Check constraint for data integrity');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Assign categories to coaches in the user_profiles table');
    console.log('   2. Coaches can now access videos for their assigned categories');
    console.log('');
    console.log('💡 Example SQL to assign categories to a coach:');
    console.log('   UPDATE user_profiles');
    console.log('   SET assigned_categories = ARRAY[');
    console.log('     (SELECT id FROM categories WHERE code = \'men\'),');
    console.log('     (SELECT id FROM categories WHERE code = \'women\')');
    console.log('   ]');
    console.log('   WHERE role = \'coach\' AND user_id = \'your-user-id-here\';');

  } catch (err) {
    console.error('❌ Setup failed:', err);
    console.log('📝 Manual setup required:');
    console.log('   1. Go to your Supabase Dashboard');
    console.log('   2. Open SQL Editor');
    console.log('   3. Copy and paste the contents of scripts/add_assigned_categories_simple.sql');
    console.log('   4. Execute the SQL');
  }
}

setupCoachCategories();
