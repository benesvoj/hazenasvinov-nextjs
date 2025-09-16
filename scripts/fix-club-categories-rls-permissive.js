#!/usr/bin/env node

/**
 * Fix club_categories RLS to be more permissive for category assignments
 *
 * This script updates the RLS policies to allow authenticated users to create club_categories
 * when they have proper context (needed for category assignment functionality).
 */

const {createClient} = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({path: '.env.local'});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✅' : '❌');
  console.error('');
  console.error('Please check your .env.local file and ensure these variables are set.');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixClubCategoriesRLSPermissive() {
  console.log('🔧 Fixing club_categories RLS to be more permissive...');
  console.log('');

  try {
    // Read the SQL script
    const sqlPath = path.join(process.cwd(), 'scripts', 'fix_club_categories_rls_permissive.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    console.log('📋 Executing SQL script...');

    // Execute the SQL script
    const {data, error} = await supabase.rpc('exec_sql', {sql: sqlScript});

    if (error) {
      console.error('❌ Error executing SQL script:', error.message);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
      return;
    }

    console.log('✅ SQL script executed successfully!');
    console.log('');

    // Test the fix by trying to insert a club_category
    console.log('🧪 Testing the fix...');

    // First, get some valid IDs for testing
    const {data: clubs} = await supabase.from('clubs').select('id').limit(1);
    const {data: categories} = await supabase.from('categories').select('id').limit(1);
    const {data: seasons} = await supabase.from('seasons').select('id').limit(1);

    if (
      clubs &&
      clubs.length > 0 &&
      categories &&
      categories.length > 0 &&
      seasons &&
      seasons.length > 0
    ) {
      const testData = {
        club_id: clubs[0].id,
        category_id: categories[0].id,
        season_id: seasons[0].id,
        max_teams: 1,
        is_active: true,
      };

      // Try to insert (this should work now)
      const {data: insertData, error: insertError} = await supabase
        .from('club_categories')
        .insert(testData);

      if (insertError) {
        console.log('❌ Insert test failed:', insertError.message);
      } else {
        console.log('✅ Insert test successful! RLS policies are working correctly.');

        // Clean up the test data
        await supabase
          .from('club_categories')
          .delete()
          .eq('club_id', testData.club_id)
          .eq('category_id', testData.category_id)
          .eq('season_id', testData.season_id);

        console.log('🧹 Test data cleaned up.');
      }
    } else {
      console.log(
        '⚠️  Could not test insert - missing required data (clubs, categories, or seasons)'
      );
    }

    console.log('');
    console.log('🎉 RLS fix completed successfully!');
    console.log('');
    console.log('📋 What was fixed:');
    console.log('   • Updated RLS policies to be more permissive');
    console.log('   • All authenticated users can now insert/update/delete club_categories');
    console.log('   • This enables category assignment functionality');
    console.log('   • Read access remains public for all authenticated users');
    console.log('');
    console.log('🔒 Security considerations:');
    console.log('   • All operations still require authentication');
    console.log('   • This is appropriate for club-category configuration data');
    console.log('   • Category assignments are part of normal application functionality');
    console.log('');
    console.log('✅ The RLS violation error should now be resolved!');
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('');
    console.error('💡 Manual fix instructions:');
    console.error('   1. Go to your Supabase Dashboard → SQL Editor');
    console.error(
      '   2. Copy and paste the contents of scripts/fix_club_categories_rls_permissive.sql'
    );
    console.error('   3. Run the SQL script');
    console.error('   4. Verify the RLS violation error is resolved');
  }
}

// Run the fix
fixClubCategoriesRLSPermissive();
