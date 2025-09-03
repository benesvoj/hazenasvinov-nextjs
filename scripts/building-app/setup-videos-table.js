const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
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

async function setupVideosTable() {
  try {
    console.log('🚀 Setting up videos table...');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'create_videos_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try direct query as fallback
      console.log('🔄 Trying direct query...');
      const { data: directData, error: directError } = await supabase
        .from('videos')
        .select('id')
        .limit(1);

      if (directError) {
        console.error('❌ Direct query also failed:', directError);
        console.log('\n📋 Manual setup required:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run the following SQL:');
        console.log('\n' + sql);
        return;
      } else {
        console.log('✅ Videos table already exists');
      }
    } else {
      console.log('✅ Videos table created successfully');
    }

    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('videos')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Error testing videos table:', testError);
    } else {
      console.log('✅ Videos table is working correctly');
    }

    console.log('\n🎉 Videos table setup completed!');
    console.log('\n📝 Next steps:');
    console.log('1. The videos table is ready for use');
    console.log('2. You can now add videos through the admin interface');
    console.log('3. Videos will be filtered by category for coaches');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\n📋 Manual setup required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the SQL from create_videos_table.sql');
  }
}

// Run the setup
setupVideosTable();
