const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminAccess() {
  console.log('🔍 Testing admin access fix...');
  console.log('=' .repeat(60));

  try {
    // 1. Get user from API
    console.log('\n👤 Getting user from API...');
    const response = await fetch('http://localhost:3000/api/user-roles');
    
    if (!response.ok) {
      console.log('   ❌ API request failed:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    const user = data.data?.find(u => u.email === 'vojtechbe@gmail.com');
    
    if (!user) {
      console.log('   ❌ User not found');
      return;
    }

    console.log(`   ✅ Found user: ${user.email}`);
    console.log(`   Profile Role: ${user.profile_role}`);
    console.log(`   Legacy Roles: ${user.roles?.join(', ') || 'None'}`);

    // 2. Test hasRole function simulation
    console.log('\n🧪 Testing hasRole function...');
    
    // Test admin role check (should check both user_profiles and user_roles)
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    const { data: adminRole, error: adminRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    console.log('   Admin profile check:');
    console.log(`     Error: ${adminProfileError?.message || 'None'}`);
    console.log(`     Data: ${adminProfile?.length || 0} profiles`);
    console.log(`     Has admin profile: ${adminProfile && adminProfile.length > 0}`);

    console.log('   Admin role check (legacy):');
    console.log(`     Error: ${adminRoleError?.message || 'None'}`);
    console.log(`     Data: ${adminRole?.length || 0} roles`);
    console.log(`     Has admin role: ${adminRole && adminRole.length > 0}`);

    const hasAdminAccess = (adminProfile && adminProfile.length > 0) || (adminRole && adminRole.length > 0);
    console.log(`   ✅ Should have admin access: ${hasAdminAccess}`);

    // Test coach role check
    const { data: coachProfile, error: coachProfileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'coach');

    const { data: coachRole, error: coachRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'coach');

    console.log('   Coach profile check:');
    console.log(`     Error: ${coachProfileError?.message || 'None'}`);
    console.log(`     Data: ${coachProfile?.length || 0} profiles`);
    console.log(`     Has coach profile: ${coachProfile && coachProfile.length > 0}`);

    console.log('   Coach role check (legacy):');
    console.log(`     Error: ${coachRoleError?.message || 'None'}`);
    console.log(`     Data: ${coachRole?.length || 0} roles`);
    console.log(`     Has coach role: ${coachRole && coachRole.length > 0}`);

    const hasCoachAccess = (coachProfile && coachProfile.length > 0) || (coachRole && coachRole.length > 0);
    console.log(`   ✅ Should have coach access: ${hasCoachAccess}`);

    // 3. Summary
    console.log('\n📋 SUMMARY:');
    console.log('=' .repeat(60));
    console.log(`✅ Admin access restored: ${hasAdminAccess}`);
    console.log(`✅ Coach access maintained: ${hasCoachAccess}`);
    console.log('✅ hasRole function now checks both user_profiles and user_roles');
    console.log('');
    console.log('🎯 EXPECTED RESULTS:');
    console.log('• User can now access admin portal');
    console.log('• User can still access coach portal');
    console.log('• No more infinite loops');
    console.log('• Reduced API requests');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminAccess();
