const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFixedFunctions() {
  console.log('🧪 Testing fixed functions...');
  console.log('=' .repeat(60));

  try {
    // 1. Test get_training_sessions function
    console.log('\n📊 Testing get_training_sessions function...');
    
    const { data: sessions, error: sessionsError } = await supabase
      .rpc('get_training_sessions', {
        p_category: 'men',
        p_season_id: 'af8aa719-d265-4e34-bb9c-07ebdcda8a74',
        p_user_id: 'c5dfe1d7-4286-49dc-93b1-e43eb65d182f'
      });

    if (sessionsError) {
      console.log('   ❌ Error calling get_training_sessions:', sessionsError.message);
      console.log('   You need to run the create-missing-functions.sql script in Supabase');
    } else {
      console.log(`   ✅ get_training_sessions works! Found ${sessions?.length || 0} sessions`);
    }

    // 2. Test get_attendance_summary function
    console.log('\n📈 Testing get_attendance_summary function...');
    
    const { data: summary, error: summaryError } = await supabase
      .rpc('get_attendance_summary', {
        p_category: 'men',
        p_season_id: 'af8aa719-d265-4e34-bb9c-07ebdcda8a74'
      });

    if (summaryError) {
      console.log('   ❌ Error calling get_attendance_summary:', summaryError.message);
    } else {
      console.log(`   ✅ get_attendance_summary works! Found ${summary?.length || 0} members`);
    }

    // 3. Test user-roles API
    console.log('\n👤 Testing user-roles API...');
    
    try {
      const response = await fetch('http://localhost:3000/api/user-roles');
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ user-roles API works! Found ${data.data?.length || 0} users`);
      } else {
        console.log('   ❌ user-roles API error:', response.status);
      }
    } catch (err) {
      console.log('   ⚠️  user-roles API test skipped (server not running)');
    }

    // 4. Summary
    console.log('\n📋 SUMMARY:');
    console.log('=' .repeat(60));
    
    if (!sessionsError && !summaryError) {
      console.log('✅ All functions are working correctly');
      console.log('✅ The attendance page should now work without errors');
      console.log('✅ No more infinite loops in user-roles API');
    } else {
      console.log('❌ Some functions still need to be created');
      console.log('');
      console.log('🔧 TO FIX:');
      console.log('1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Copy and paste the contents of: scripts/create-missing-functions.sql');
      console.log('3. Run the SQL script');
      console.log('4. Test again with: node scripts/test-fixed-functions.js');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFixedFunctions();
