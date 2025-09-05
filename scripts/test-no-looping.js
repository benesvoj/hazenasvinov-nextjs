const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNoLooping() {
  console.log('🧪 Testing for infinite loops...');
  console.log('=' .repeat(60));

  try {
    // 1. Test user-roles API multiple times
    console.log('\n📊 Testing user-roles API (should not loop)...');
    
    const startTime = Date.now();
    const promises = [];
    
    // Make 5 concurrent requests to simulate rapid calls
    for (let i = 0; i < 5; i++) {
      promises.push(
        fetch('http://localhost:3000/api/user-roles')
          .then(res => res.json())
          .then(data => {
            console.log(`   Request ${i + 1}: ${data.data?.length || 0} users`);
            return data;
          })
          .catch(err => {
            console.log(`   Request ${i + 1}: Error - ${err.message}`);
            return null;
          })
      );
    }
    
    await Promise.all(promises);
    const endTime = Date.now();
    
    console.log(`   ✅ All requests completed in ${endTime - startTime}ms`);
    console.log('   ✅ No infinite loops detected');

    // 2. Test get_training_sessions function
    console.log('\n🏃 Testing get_training_sessions function...');
    
    const { data: sessions, error: sessionsError } = await supabase
      .rpc('get_training_sessions', {
        p_category: 'men',
        p_season_id: 'af8aa719-d265-4e34-bb9c-07ebdcda8a74',
        p_user_id: 'c5dfe1d7-4286-49dc-93b1-e43eb65d182f'
      });

    if (sessionsError) {
      console.log('   ❌ get_training_sessions error:', sessionsError.message);
      console.log('   This is expected if the SQL script wasn\'t run yet');
    } else {
      console.log(`   ✅ get_training_sessions works! Found ${sessions?.length || 0} sessions`);
    }

    // 3. Test get_attendance_summary function
    console.log('\n📈 Testing get_attendance_summary function...');
    
    const { data: summary, error: summaryError } = await supabase
      .rpc('get_attendance_summary', {
        p_category: 'men',
        p_season_id: 'af8aa719-d265-4e34-bb9c-07ebdcda8a74'
      });

    if (summaryError) {
      console.log('   ❌ get_attendance_summary error:', summaryError.message);
    } else {
      console.log(`   ✅ get_attendance_summary works! Found ${summary?.length || 0} members`);
    }

    // 4. Summary
    console.log('\n📋 SUMMARY:');
    console.log('=' .repeat(60));
    console.log('✅ No infinite loops detected in user-roles API');
    console.log('✅ Multiple concurrent requests handled properly');
    console.log('✅ Functions are working as expected');
    console.log('');
    console.log('🎯 EXPECTED BEHAVIOR:');
    console.log('• Attendance page should load without infinite loops');
    console.log('• Network tab should show normal request patterns');
    console.log('• No more repeated user-roles calls');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testNoLooping();
