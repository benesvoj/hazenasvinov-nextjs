#!/usr/bin/env node

// Check database schema and RLS policies
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function checkDatabase() {
  console.log('🔍 Checking database schema and RLS policies...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Environment variables not found');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Check if blog_posts table exists
    console.log('1. Checking if blog_posts table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('blog_posts')
      .select('id')
      .limit(1);
    
    if (tableError) {
      if (tableError.message.includes('relation "blog_posts" does not exist')) {
        console.log('❌ blog_posts table does not exist');
        console.log('   You need to create the table first');
        console.log('\n   Run this SQL in your Supabase SQL editor:');
        console.log(`
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  tags TEXT[],
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read posts" ON blog_posts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert posts" ON blog_posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update posts" ON blog_posts
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete posts" ON blog_posts
  FOR DELETE USING (auth.role() = 'authenticated');
        `);
        return;
      } else {
        console.log('❌ Error checking table:', tableError.message);
        return;
      }
    } else {
      console.log('✅ blog_posts table exists');
    }
    
    // Check table structure
    console.log('\n2. Checking table structure...');
    try {
      const { data: structure, error: structureError } = await supabase
        .from('blog_posts')
        .select('*')
        .limit(0); // This will return column info without data
      
      if (structureError) {
        console.log('⚠️  Could not check table structure:', structureError.message);
      } else {
        console.log('✅ Table structure accessible');
      }
    } catch (e) {
      console.log('⚠️  Could not check table structure');
    }
    
    // Check RLS status
    console.log('\n3. Checking RLS policies...');
    try {
      // Try to insert a test record to see what happens
      const { data: insertTest, error: insertError } = await supabase
        .from('blog_posts')
        .insert({
          title: 'Test Post',
          slug: 'test-post-' + Date.now(),
          content: 'This is a test post',
          excerpt: 'Test excerpt',
          author_id: 'test-user'
        })
        .select();
      
      if (insertError) {
        if (insertError.message.includes('permission denied')) {
          console.log('⚠️  Insert permission denied - RLS is working');
          console.log('   This is expected for unauthenticated users');
          console.log('   You need to log in to create posts');
        } else {
          console.log('❌ Insert error:', insertError.message);
        }
      } else {
        console.log('✅ Insert successful (RLS might not be enabled)');
        console.log('   Test post created:', insertTest);
        
        // Clean up test post
        if (insertTest && insertTest[0]) {
          await supabase
            .from('blog_posts')
            .delete()
            .eq('id', insertTest[0].id);
          console.log('   Test post cleaned up');
        }
      }
    } catch (e) {
      console.log('❌ Error testing insert:', e.message);
    }
    
    console.log('\n================================');
    console.log('Summary:');
    console.log('- Supabase connection: ✅ Working');
    console.log('- Environment variables: ✅ Configured');
    console.log('- Table exists: ' + (tableCheck ? '✅ Yes' : '❌ No'));
    console.log('- RLS policies: ' + (tableCheck ? '⚠️  Need to check' : 'N/A'));
    
    if (!tableCheck) {
      console.log('\nNext steps:');
      console.log('1. Go to your Supabase project dashboard');
      console.log('2. Open the SQL Editor');
      console.log('3. Run the CREATE TABLE script above');
      console.log('4. Refresh this page and try again');
    } else {
      console.log('\nNext steps:');
      console.log('1. Log in to your admin portal');
      console.log('2. Try to create a post');
      console.log('3. If you still get errors, check the RLS policies');
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

checkDatabase();
