#!/usr/bin/env node

// Debug database permission issues
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function debugDatabase() {
  console.log('🔍 Debugging database permission issues...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Environment variables not found');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('1. Testing basic connection...');
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ User error:', userError.message);
      return;
    }
    
    console.log('✅ Basic connection working');
    console.log('   User:', user.user ? 'Authenticated' : 'Not authenticated');
    
    // Try to check what tables exist without triggering RLS
    console.log('\n2. Checking available tables...');
    try {
      // This should work even without permissions
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE');
      
      if (tablesError) {
        console.log('⚠️  Could not check tables:', tablesError.message);
      } else {
        console.log('✅ Available tables:');
        tables.forEach(table => {
          console.log(`   - ${table.table_name}`);
        });
      }
    } catch (e) {
      console.log('⚠️  Could not check tables:', e.message);
    }
    
    // Try to check if blog_posts exists using a different approach
    console.log('\n3. Checking blog_posts table specifically...');
    try {
      // Try to get table info without selecting data
      const { data: tableInfo, error: tableInfoError } = await supabase
        .from('blog_posts')
        .select('id')
        .limit(0); // This should just return column info
      
      if (tableInfoError) {
        console.log('❌ Table info error:', tableInfoError.message);
        
        if (tableInfoError.message.includes('permission denied for table users')) {
          console.log('\n🔍 This suggests there might be:');
          console.log('   - A database trigger on blog_posts');
          console.log('   - A function that references users table');
          console.log('   - RLS policies that check user data');
          console.log('   - A view that joins with users table');
        }
      } else {
        console.log('✅ Table info accessible');
      }
    } catch (e) {
      console.log('❌ Error checking table info:', e.message);
    }
    
    // Check if there are any functions or triggers
    console.log('\n4. Checking for database objects...');
    try {
      const { data: functions, error: funcError } = await supabase
        .from('information_schema.routines')
        .select('routine_name, routine_type')
        .eq('routine_schema', 'public');
      
      if (funcError) {
        console.log('⚠️  Could not check functions:', funcError.message);
      } else {
        console.log('✅ Functions found:');
        functions.forEach(func => {
          console.log(`   - ${func.routine_name} (${func.routine_type})`);
        });
      }
    } catch (e) {
      console.log('⚠️  Could not check functions:', e.message);
    }
    
    console.log('\n================================');
    console.log('Analysis:');
    console.log('- The "permission denied for table users" error suggests');
    console.log('  that something is trying to access the users table when');
    console.log('  you query blog_posts');
    console.log('\nPossible causes:');
    console.log('1. RLS policies that check user authentication');
    console.log('2. Database triggers that reference user data');
    console.log('3. Functions that join with users table');
    console.log('4. Views that include user information');
    console.log('\nNext steps:');
    console.log('1. Check your Supabase dashboard for triggers/functions');
    console.log('2. Review RLS policies on blog_posts table');
    console.log('3. Look for any database functions that might reference users');
    console.log('4. Consider temporarily disabling RLS to test');
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

debugDatabase();
