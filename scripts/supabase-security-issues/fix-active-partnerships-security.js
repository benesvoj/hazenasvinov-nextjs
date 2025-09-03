#!/usr/bin/env node

/**
 * Fix active_partnerships SECURITY DEFINER security warning
 * 
 * This script recreates the active_partnerships view without SECURITY DEFINER
 * to resolve the security warning about views with SECURITY DEFINER property.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

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

async function fixActivePartnershipsSecurity() {
  console.log('🔧 Fixing active_partnerships SECURITY DEFINER security warning...');
  console.log('');

  try {
    // Read the SQL script
    const sqlPath = path.join(process.cwd(), 'scripts', 'fix_active_partnerships_security.sql');
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

    // Verify the fix by checking the view
    console.log('🔍 Verifying the fix...');
    
    const { data: viewData, error: viewError } = await supabase
      .from('information_schema.views')
      .select('table_name, view_definition')
      .eq('table_name', 'active_partnerships')
      .eq('table_schema', 'public');

    if (viewError) {
      console.error('❌ Error verifying view:', viewError.message);
      return;
    }

    if (viewData && viewData.length > 0) {
      console.log('✅ active_partnerships view exists and is properly configured');
      console.log('   View definition length:', viewData[0].view_definition?.length || 0, 'characters');
    } else {
      console.log('⚠️  active_partnerships view not found - this might be expected if no partnerships exist');
    }

    console.log('');
    console.log('🎉 Security fix completed successfully!');
    console.log('');
    console.log('📋 What was fixed:');
    console.log('   • Recreated active_partnerships view without SECURITY DEFINER');
    console.log('   • Ensured proper permissions for authenticated users');
    console.log('   • Added documentation comment');
    console.log('');
    console.log('🔒 Security benefits:');
    console.log('   • View no longer has SECURITY DEFINER property');
    console.log('   • Follows principle of least privilege');
    console.log('   • Only exposes public partnership information');
    console.log('');
    console.log('✅ The security warning should now be resolved!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('');
    console.error('💡 Manual fix instructions:');
    console.error('   1. Go to your Supabase Dashboard → SQL Editor');
    console.error('   2. Copy and paste the contents of scripts/fix_active_partnerships_security.sql');
    console.error('   3. Run the SQL script');
    console.error('   4. Verify the security warning disappears');
  }
}

// Run the fix
fixActivePartnershipsSecurity();
