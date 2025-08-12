#!/usr/bin/env node

// Test Supabase connection directly
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection directly...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Environment variables not found');
    return;
  }
  
  console.log('Creating Supabase client...');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('Testing connection with auth.getSession()...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      console.log('Error details:', error);
    } else {
      console.log('✅ Connection successful!');
      console.log('Session data:', data);
    }
    
    // Test a simple database query
    console.log('\nTesting database query...');
    try {
      const { data: testData, error: testError } = await supabase
        .from('blog_posts')
        .select('id')
        .limit(1);
      
      if (testError) {
        if (testError.message.includes('relation "blog_posts" does not exist')) {
          console.log('⚠️  blog_posts table does not exist');
          console.log('   This is expected if you haven\'t created the table yet');
        } else if (testError.message.includes('permission denied')) {
          console.log('⚠️  Permission denied - this is normal for unauthenticated users');
        } else {
          console.log('❌ Database query failed:', testError.message);
        }
      } else {
        console.log('✅ Database query successful');
        console.log('Query result:', testData);
      }
    } catch (dbError) {
      console.log('❌ Database query error:', dbError.message);
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('Error details:', error);
  }
}

testSupabaseConnection();
