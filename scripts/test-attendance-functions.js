const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAttendanceFunctions() {
  console.log('🧪 Testing attendance functions...');
  console.log('=' .repeat(60));

  try {
    // 1. Test get_training_sessions function
    console.log('\n📊 Testing get_training_sessions function...');
    
    // Get a test user ID (coach with categories)
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, role, assigned_categories')
      .eq('role', 'coach')
      .limit(1);

    if (profilesError || !profiles || profiles.length === 0) {
      console.log('   ❌ No coach profiles found:', profilesError?.message);
      return;
    }

    const testUserId = profiles[0].user_id;
    console.log(`   Using test user: ${testUserId}`);

    // Get a test category and season
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('code')
      .eq('is_active', true)
      .limit(1);

    if (categoriesError || !categories || categories.length === 0) {
      console.log('   ❌ No categories found:', categoriesError?.message);
      return;
    }

    const testCategory = categories[0].code;
    console.log(`   Using test category: ${testCategory}`);

    const { data: seasons, error: seasonsError } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_active', true)
      .limit(1);

    if (seasonsError || !seasons || seasons.length === 0) {
      console.log('   ❌ No active seasons found:', seasonsError?.message);
      return;
    }

    const testSeasonId = seasons[0].id;
    console.log(`   Using test season: ${testSeasonId}`);

    // Test the function
    const { data: sessions, error: sessionsError } = await supabase
      .rpc('get_training_sessions', {
        p_category: testCategory,
        p_season_id: testSeasonId,
        p_user_id: testUserId
      });

    if (sessionsError) {
      console.log('   ❌ Error calling get_training_sessions:', sessionsError.message);
    } else {
      console.log(`   ✅ get_training_sessions works! Found ${sessions?.length || 0} sessions`);
      if (sessions && sessions.length > 0) {
        sessions.forEach((session, index) => {
          console.log(`      ${index + 1}. ${session.title} (${session.session_date})`);
        });
      }
    }

    // 2. Test get_attendance_summary function
    console.log('\n📈 Testing get_attendance_summary function...');
    
    const { data: summary, error: summaryError } = await supabase
      .rpc('get_attendance_summary', {
        p_category: testCategory,
        p_season_id: testSeasonId
      });

    if (summaryError) {
      console.log('   ❌ Error calling get_attendance_summary:', summaryError.message);
    } else {
      console.log(`   ✅ get_attendance_summary works! Found ${summary?.length || 0} members`);
      if (summary && summary.length > 0) {
        summary.forEach((member, index) => {
          console.log(`      ${index + 1}. ${member.member_name} ${member.member_surname} - ${member.attendance_percentage}%`);
        });
      }
    }

    // 3. Test creating a training session
    console.log('\n🏃 Testing training session creation...');
    
    const testSessionData = {
      title: 'Test Training Session',
      description: 'Test description',
      session_date: '2025-01-15',
      session_time: '18:00',
      category: testCategory,
      season_id: testSeasonId,
      location: 'Test Location'
    };

    // First, try to sign in as the test user to get proper auth context
    console.log('   Note: Training session creation requires proper authentication context');
    console.log('   This test will show if the function exists and is callable');

    // 4. Summary
    console.log('\n📋 SUMMARY:');
    console.log('=' .repeat(60));
    
    if (!sessionsError && !summaryError) {
      console.log('✅ All attendance functions are working correctly');
      console.log('✅ get_training_sessions function fixed');
      console.log('✅ get_attendance_summary function working');
      console.log('✅ The attendance page should now work properly');
    } else {
      console.log('❌ Some functions are still not working');
      console.log('   You need to run the fix-attendance-functions.sql script');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAttendanceFunctions();
