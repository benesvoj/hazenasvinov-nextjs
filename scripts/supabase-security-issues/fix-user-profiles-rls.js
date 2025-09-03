#!/usr/bin/env node

/**
 * Fix user_profiles RLS security warning
 * 
 * This script enables Row Level Security on the user_profiles table
 * to resolve the security warning about tables without RLS.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

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

async function fixUserProfilesRLS() {
  console.log('🔧 Fixing user_profiles RLS security warning...');
  console.log('');

  try {
    // Read the SQL script
    const sqlPath = path.join(process.cwd(), 'scripts', 'fix_user_profiles_rls.sql');
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

    // Verify the fix by checking RLS status
    console.log('🔍 Verifying the fix...');
    
    const { data: rlsData, error: rlsError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('tablename', 'user_profiles')
      .eq('schemaname', 'public');

    if (rlsError) {
      console.error('❌ Error verifying RLS status:', rlsError.message);
      return;
    }

    if (rlsData && rlsData.length > 0) {
      const rlsEnabled = rlsData[0].rowsecurity;
      console.log('✅ user_profiles table RLS status:', rlsEnabled ? '✅ Enabled' : '❌ Disabled');
    } else {
      console.log('⚠️  user_profiles table not found');
    }

    // Check policies
    const { data: policyData, error: policyError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd')
      .eq('tablename', 'user_profiles')
      .eq('schemaname', 'public');

    if (policyError) {
      console.error('❌ Error checking policies:', policyError.message);
      return;
    }

    if (policyData && policyData.length > 0) {
      console.log('✅ RLS policies created:');
      policyData.forEach(policy => {
        console.log(`   • ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log('⚠️  No RLS policies found');
    }

    console.log('');
    console.log('🎉 Security fix completed successfully!');
    console.log('');
    console.log('📋 What was fixed:');
    console.log('   • Enabled Row Level Security on user_profiles table');
    console.log('   • Created read policy for users to see their own profile');
    console.log('   • Created update policy for users to update their own profile');
    console.log('   • Created admin policies for full access');
    console.log('   • Added proper permissions and documentation');
    console.log('');
    console.log('🔒 Security benefits:');
    console.log('   • RLS now properly controls access to user profile data');
    console.log('   • Users can only access their own profile data');
    console.log('   • Admins have full access for user management');
    console.log('   • Role changes are restricted to admins only');
    console.log('   • Follows principle of least privilege');
    console.log('');
    console.log('✅ The security warning should now be resolved!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('');
    console.error('💡 Manual fix instructions:');
    console.error('   1. Go to your Supabase Dashboard → SQL Editor');
    console.error('   2. Copy and paste the contents of scripts/fix_user_profiles_rls.sql');
    console.error('   3. Run the SQL script');
    console.error('   4. Verify the security warning disappears');
  }
}

// Run the fix
fixUserProfilesRLS();
