#!/usr/bin/env node

/**
 * Programmatic script to update the own_club_matches materialized view
 * This uses the application's Supabase client to run the SQL
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({path: '.env.local'});

async function updateMaterializedView() {
  try {
    // Import Supabase client
    const {createClient} = require('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Updating own_club_matches materialized view...');

    // Read the SQL script
    const sqlPath = path.join(__dirname, 'update-own-club-matches-view.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📊 Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);

        const {error} = await supabase.rpc('exec_sql', {sql: statement});

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }

    console.log('🎉 Materialized view update complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test your application to see if category information is now displayed');
    console.log('2. Check the MatchRow components for category.name and category.description');
    console.log('3. Verify that venue information is showing correctly');
  } catch (error) {
    console.error('❌ Error updating materialized view:', error.message);
    console.log('');
    console.log('💡 Alternative: Run the SQL script manually in Supabase SQL editor');
    console.log('📝 Copy the contents of scripts/update-own-club-matches-view.sql');
    process.exit(1);
  }
}

// Run the update
updateMaterializedView();
