#!/usr/bin/env node

// Simple script to check environment variables
console.log('🔍 Checking Supabase environment variables...\n');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Environment Variables Status:');
console.log('================================');

if (supabaseUrl) {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL: Set');
  console.log(`   Value: ${supabaseUrl.substring(0, 30)}...`);
  
  if (supabaseUrl.startsWith('https://')) {
    console.log('   ✅ Valid URL format');
  } else {
    console.log('   ❌ Invalid URL format (should start with https://)');
  }
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL: Missing');
}

console.log('');

if (supabaseKey) {
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: Set');
  console.log(`   Value: ${supabaseKey.substring(0, 20)}...`);
  
  if (supabaseKey.startsWith('eyJ')) {
    console.log('   ✅ Valid key format');
  } else {
    console.log('   ❌ Invalid key format (should start with eyJ)');
  }
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: Missing');
}

console.log('\n================================');
console.log('Next Steps:');
console.log('1. If variables are missing, create .env.local file');
console.log('2. If format is invalid, check your Supabase project settings');
console.log('3. Restart your development server after making changes');
console.log('4. Run this script again to verify the fix');

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Environment variables are not properly configured!');
  process.exit(1);
} else if (!supabaseUrl.startsWith('https://') || !supabaseKey.startsWith('eyJ')) {
  console.log('\n⚠️  Environment variables have invalid format!');
  process.exit(1);
} else {
  console.log('\n✅ Environment variables are properly configured!');
}
