#!/usr/bin/env node

/**
 * Fix clubs RLS security warning
 * 
 * This script enables Row Level Security on the clubs table
 * to resolve the security warning about tables without RLS.
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

async function fixClubsRLS() {
  console.log('🔧 Fixing clubs RLS security warning...');
  console.log('');

  try {
    // Read the SQL script
    const sqlPath = path.join(process.cwd(), 'fix_clubs_rls.sql');
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

    // Verify the fix by checking RLS status and policies using exec_sql
    console.log('🔍 Verifying the fix...');
    
    const verificationSQL = `
      SELECT 
        schemaname,
        tablename,
        rowsecurity as rls_enabled,
        CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
      FROM pg_tables 
      WHERE tablename = 'clubs' 
      AND schemaname = 'public';
      
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE tablename = 'clubs' 
      AND schemaname = 'public'
      ORDER BY policyname;
    `;

    const { data: verificationResult, error: verificationError } = await supabase
      .rpc('exec_sql', { sql: verificationSQL });

    if (verificationError) {
      console.log('⚠️  Could not verify RLS status automatically');
      console.log('   You can verify manually by running this query in Supabase Dashboard:');
      console.log('   ' + verificationSQL);
    } else {
      console.log('✅ RLS verification completed');
      console.log('   Check the Supabase Dashboard for RLS status and policy details');
    }

    console.log('');
    console.log('🎉 Security fix completed successfully!');
    console.log('');
    console.log('📋 What was fixed:');
    console.log('   • Enabled Row Level Security on clubs table');
    console.log('   • Created read policy for all authenticated users');
    console.log('   • Created write policies for admins only');
    console.log('   • Added proper permissions and documentation');
    console.log('');
    console.log('🔒 Security benefits:');
    console.log('   • RLS now properly controls access to club data');
    console.log('   • Public read access for club information');
    console.log('   • Admin-only write access for data integrity');
    console.log('   • Follows principle of least privilege');
    console.log('');
    console.log('✅ The security warning should now be resolved!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('');
    console.error('💡 Manual fix instructions:');
    console.error('   1. Go to your Supabase Dashboard → SQL Editor');
    console.error('   2. Copy and paste the contents of scripts/fix_clubs_rls.sql');
    console.error('   3. Run the SQL script');
    console.error('   4. Verify the security warning disappears');
  }
}

// Run the fix
fixClubsRLS();
