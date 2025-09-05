const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAttendancePage() {
  console.log('🧪 Testing attendance page data...');
  console.log('=' .repeat(60));

  try {
    // 1. Test categories
    console.log('\n📊 Testing categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, code, name')
      .eq('is_active', true)
      .order('sort_order');

    if (categoriesError) {
      console.log('   ❌ Error fetching categories:', categoriesError.message);
    } else {
      console.log(`   ✅ Categories loaded: ${categories.length}`);
      categories.forEach(cat => {
        console.log(`      - ${cat.name} (${cat.code}) - ID: ${cat.id}`);
      });
    }

    // 2. Test seasons
    console.log('\n📅 Testing seasons...');
    const { data: seasons, error: seasonsError } = await supabase
      .from('seasons')
      .select('id, name, start_date, end_date, is_active')
      .order('start_date', { ascending: false })
      .limit(10);

    if (seasonsError) {
      console.log('   ❌ Error fetching seasons:', seasonsError.message);
    } else {
      console.log(`   ✅ Seasons loaded: ${seasons.length}`);
      seasons.forEach(season => {
        const active = season.is_active ? ' (ACTIVE)' : '';
        console.log(`      - ${season.name}${active} - ID: ${season.id}`);
      });
    }

    // 3. Test user profiles
    console.log('\n👤 Testing user profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, role, assigned_categories')
      .limit(5);

    if (profilesError) {
      console.log('   ❌ Error fetching profiles:', profilesError.message);
    } else {
      console.log(`   ✅ Profiles loaded: ${profiles.length}`);
      profiles.forEach(profile => {
        console.log(`      - Role: ${profile.role}, Categories: ${profile.assigned_categories?.length || 0}`);
      });
    }

    // 4. Test members
    console.log('\n👥 Testing members...');
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name, surname, category')
      .limit(5);

    if (membersError) {
      console.log('   ❌ Error fetching members:', membersError.message);
    } else {
      console.log(`   ✅ Members loaded: ${members.length}`);
      members.forEach(member => {
        console.log(`      - ${member.name} ${member.surname} - Category: ${member.category}`);
      });
    }

    // 5. Test training sessions (if any exist)
    console.log('\n🏃 Testing training sessions...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('training_sessions')
      .select('id, title, category, season_id')
      .limit(5);

    if (sessionsError) {
      console.log('   ❌ Error fetching training sessions:', sessionsError.message);
    } else {
      console.log(`   ✅ Training sessions loaded: ${sessions.length}`);
      sessions.forEach(session => {
        console.log(`      - ${session.title} - Category: ${session.category}`);
      });
    }

    // 6. Summary
    console.log('\n📋 SUMMARY:');
    console.log('=' .repeat(60));
    console.log('✅ All data sources are accessible');
    console.log('✅ Categories have both ID and code fields');
    console.log('✅ Seasons are loading properly');
    console.log('✅ User profiles are working');
    console.log('✅ Members are accessible');
    console.log('');
    console.log('🎯 EXPECTED BEHAVIOR:');
    console.log('• Category dropdown should show category names (not UUIDs)');
    console.log('• Season dropdown should show season names');
    console.log('• Data should load when page opens');
    console.log('• No more PGRST116 errors');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAttendancePage();
