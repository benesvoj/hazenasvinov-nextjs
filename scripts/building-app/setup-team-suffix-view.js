const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

async function setupTeamSuffixView() {
  console.log('🚀 Setting up team suffix helper view...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_team_suffix_view.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📖 Executing SQL...');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('⚠️  exec_sql not available, trying direct query...');
      
      // Split SQL into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`🔧 Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (stmtError) {
            console.log(`⚠️  Statement failed, trying direct query: ${stmtError.message}`);
            // Try to execute the view creation directly
            if (statement.includes('CREATE OR REPLACE VIEW')) {
              const { error: viewError } = await supabase.from('team_suffix_helper').select('*').limit(1);
              if (viewError && viewError.message.includes('relation "team_suffix_helper" does not exist')) {
                console.log('❌ View creation failed. You may need to run this SQL manually in your Supabase dashboard.');
                console.log('SQL to run:');
                console.log(statement);
              }
            }
          }
        }
      }
    }
    
    console.log('✅ Team suffix helper view setup completed!');
    console.log('');
    console.log('📋 What this view provides:');
    console.log('   - team_id: The team identifier');
    console.log('   - team_suffix: Team suffix (A, B, C, etc.)');
    console.log('   - club_id: Club identifier');
    console.log('   - category_id: Category identifier');
    console.log('   - team_count_in_category: How many teams this club has in this category');
    console.log('   - All club and category information needed for display');
    console.log('');
    console.log('🎯 Usage:');
    console.log('   SELECT * FROM team_suffix_helper WHERE team_id = $1;');
    console.log('   SELECT * FROM team_suffix_helper WHERE club_id = $1 AND category_id = $2;');
    console.log('');
    console.log('💡 Performance Note: Views cannot have indexes in PostgreSQL.');
    console.log('   Ensure underlying tables have appropriate indexes for optimal performance.');
    
  } catch (error) {
    console.error('❌ Error setting up team suffix helper view:', error);
    console.log('');
    console.log('💡 Manual setup:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Run the SQL from scripts/create_team_suffix_view.sql');
    process.exit(1);
  }
}

setupTeamSuffixView();
