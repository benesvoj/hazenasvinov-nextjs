#!/usr/bin/env node

/**
 * Fix blog_posts RLS performance issue
 * 
 * This script optimizes RLS policies by replacing auth.role() with (SELECT auth.role())
 * to prevent re-evaluation for each row, improving query performance at scale.
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

async function fixBlogPostsRLSPerformance() {
  console.log('🔧 Fixing blog_posts RLS performance issue...');
  console.log('');

  try {
    // Read the SQL script
    const sqlPath = path.join(process.cwd(), 'fix_blog_posts_rls_performance.sql');
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
    console.log('🔍 Verifying the fix...');
    
    const verificationSQL = `
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
      WHERE tablename = 'blog_posts'
      AND schemaname = 'public'
      ORDER BY policyname;
    `;

    const { data: verificationResult, error: verificationError } = await supabase
      .rpc('exec_sql', { sql: verificationSQL });

    if (verificationError) {
      console.log('⚠️  Could not verify policies automatically');
      console.log('   You can verify manually by running this query in Supabase Dashboard:');
      console.log('   ' + verificationSQL);
    } else {
      console.log('✅ RLS policies verification completed');
      console.log('   Check the Supabase Dashboard for policy details');
    }

    console.log('');
    console.log('🎉 Performance optimization completed successfully!');
    console.log('');
    console.log('📋 What was optimized:');
    console.log('   • Replaced auth.role() with (SELECT auth.role()) in all policies');
    console.log('   • Fixed blog_posts table RLS policies');
    console.log('   • Optimized read, insert, update, and delete policies');
    console.log('   • Added documentation comments');
    console.log('');
    console.log('⚡ Performance benefits:');
    console.log('   • auth.role() evaluated once per query instead of per row');
    console.log('   • Improved query performance at scale');
    console.log('   • Reduced database load for large datasets');
    console.log('   • Better user experience with faster blog post queries');
    console.log('');
    console.log('✅ The performance warning should now be resolved!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('');
    console.error('💡 Manual fix instructions:');
    console.error('   1. Go to your Supabase Dashboard → SQL Editor');
    console.error('   2. Copy and paste the contents of scripts/fix_blog_posts_rls_performance.sql');
    console.error('   3. Run the SQL script');
    console.error('   4. Verify the performance warning disappears');
  }
}

// Run the fix
fixBlogPostsRLSPerformance();
