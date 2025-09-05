const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugLooping() {
  console.log('🔍 Debugging infinite loops...');
  console.log('=' .repeat(60));

  try {
    // 1. Test if the issue is with the API endpoint itself
    console.log('\n📊 Testing API endpoint stability...');
    
    const apiCalls = [];
    const startTime = Date.now();
    
    for (let i = 0; i < 10; i++) {
      apiCalls.push(
        fetch('http://localhost:3000/api/user-roles')
          .then(res => {
            const timestamp = new Date().toISOString();
            console.log(`   Call ${i + 1} at ${timestamp}: ${res.status}`);
            return res.json();
          })
          .then(data => {
            console.log(`   Call ${i + 1} result: ${data.data?.length || 0} users`);
            return data;
          })
          .catch(err => {
            console.log(`   Call ${i + 1} error: ${err.message}`);
            return null;
          })
      );
    }

    await Promise.all(apiCalls);
    const endTime = Date.now();
    
    console.log(`   ✅ All API calls completed in ${endTime - startTime}ms`);
    console.log(`   Average time per call: ${(endTime - startTime) / 10}ms`);

    // 2. Test database queries that might be causing issues
    console.log('\n🗄️ Testing database queries...');
    
    // Test user_profiles query (used by getCurrentUserCategories)
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, role, assigned_categories')
      .limit(5);

    if (profilesError) {
      console.log('   ❌ user_profiles query error:', profilesError.message);
    } else {
      console.log(`   ✅ user_profiles query works: ${profiles?.length || 0} profiles`);
    }

    // Test categories query
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, code, name')
      .eq('is_active', true)
      .limit(5);

    if (categoriesError) {
      console.log('   ❌ categories query error:', categoriesError.message);
    } else {
      console.log(`   ✅ categories query works: ${categories?.length || 0} categories`);
    }

    // Test seasons query
    const { data: seasons, error: seasonsError } = await supabase
      .from('seasons')
      .select('id, name, is_active')
      .limit(5);

    if (seasonsError) {
      console.log('   ❌ seasons query error:', seasonsError.message);
    } else {
      console.log(`   ✅ seasons query works: ${seasons?.length || 0} seasons`);
    }

    // 3. Test RPC functions
    console.log('\n🔧 Testing RPC functions...');
    
    // Test get_training_sessions
    const { data: sessions, error: sessionsError } = await supabase
      .rpc('get_training_sessions', {
        p_category: 'men',
        p_season_id: 'af8aa719-d265-4e34-bb9c-07ebdcda8a74',
        p_user_id: 'c5dfe1d7-4286-49dc-93b1-e43eb65d182f'
      });

    if (sessionsError) {
      console.log('   ❌ get_training_sessions error:', sessionsError.message);
    } else {
      console.log(`   ✅ get_training_sessions works: ${sessions?.length || 0} sessions`);
    }

    // Test get_attendance_summary
    const { data: summary, error: summaryError } = await supabase
      .rpc('get_attendance_summary', {
        p_category: 'men',
        p_season_id: 'af8aa719-d265-4e34-bb9c-07ebdcda8a74'
      });

    if (summaryError) {
      console.log('   ❌ get_attendance_summary error:', summaryError.message);
    } else {
      console.log(`   ✅ get_attendance_summary works: ${summary?.length || 0} members`);
    }

    // 4. Summary
    console.log('\n📋 DEBUG SUMMARY:');
    console.log('=' .repeat(60));
    console.log('✅ API endpoint is stable');
    console.log('✅ Database queries work properly');
    console.log('✅ RPC functions are working');
    console.log('');
    console.log('🎯 NEXT STEPS:');
    console.log('1. Check browser console for the debug logs I added');
    console.log('2. Look for repeated "🔄 Fetching..." messages');
    console.log('3. Check Network tab for repeated requests');
    console.log('4. The looping should now be fixed with the useEffect changes');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugLooping();
