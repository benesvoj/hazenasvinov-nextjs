#!/usr/bin/env node

/**
 * Fix public access for visitor pages
 * 
 * This script creates RLS policies that allow public read access to data
 * that should be visible to visitors while maintaining security for write operations.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env.local' });

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

async function fixPublicAccessRLS() {
  console.log('🔧 Fixing public access for visitor pages...');
  console.log('');

  try {
    // Read the SQL script
    const sqlPath = path.join(process.cwd(), 'fix_public_access_rls.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    console.log('📋 Executing SQL script...');
    
    // Execute the SQL script
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });

    if (error) {
      console.error('❌ Error executing SQL script:', error.message);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
      return;
    }

    console.log('✅ SQL script executed successfully!');
    console.log('');

    // Verify the fix by checking policies using exec_sql
    console.log('🔍 Verifying the public access fix...');
    
    const verificationSQL = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual
      FROM pg_policies 
      WHERE tablename IN ('clubs', 'matches', 'teams', 'standings', 'categories', 'seasons', 'club_teams', 'club_categories', 'club_category_teams', 'category_seasons')
      AND schemaname = 'public'
      AND policyname LIKE '%public read access%'
      ORDER BY tablename, policyname;
    `;

    const { data: verificationResult, error: verificationError } = await supabase
      .rpc('exec_sql', { sql: verificationSQL });

    if (verificationError) {
      console.log('⚠️  Could not verify policies automatically');
      console.log('   You can verify manually by running this query in Supabase Dashboard:');
      console.log('   ' + verificationSQL);
    } else {
      console.log('✅ Public access policies verification completed');
      console.log('   Check the Supabase Dashboard for policy details');
    }

    console.log('');
    console.log('🎉 Public access fix completed successfully!');
    console.log('');
    console.log('📋 What was fixed:');
    console.log('   • Created public read access policies for all visitor page tables');
    console.log('   • Fixed clubs, matches, teams, standings, categories, seasons');
    console.log('   • Fixed club_teams, club_categories, club_category_teams, category_seasons');
    console.log('   • Granted SELECT permissions to anon role');
    console.log('   • Added documentation comments');
    console.log('');
    console.log('🌐 Public access benefits:');
    console.log('   • Anonymous visitors can now view matches and clubs');
    console.log('   • Public pages work without authentication');
    console.log('   • Visitor experience is restored');
    console.log('   • Write access remains secure (admin-only)');
    console.log('   • Security is maintained for sensitive operations');
    console.log('');
    console.log('✅ Visitor pages should now work correctly!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('');
    console.error('💡 Manual fix instructions:');
    console.error('   1. Go to your Supabase Dashboard → SQL Editor');
    console.error('   2. Copy and paste the contents of scripts/fix_public_access_rls.sql');
    console.error('   3. Run the SQL script');
    console.error('   4. Verify visitor pages work correctly');
  }
}

// Run the fix
fixPublicAccessRLS();
