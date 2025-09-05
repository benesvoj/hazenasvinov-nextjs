const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserRoles() {
  console.log('🔍 Checking user roles for vojtechbe@gmail.com...');
  console.log('=' .repeat(60));

  try {
    // 1. Check auth.users table
    console.log('\n👤 Checking auth.users...');
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .eq('email', 'vojtechbe@gmail.com');

    if (authError) {
      console.log('   ❌ Error querying auth.users:', authError.message);
    } else {
      console.log(`   ✅ Found ${authUsers?.length || 0} users in auth.users`);
      if (authUsers && authUsers.length > 0) {
        console.log('   User ID:', authUsers[0].id);
        console.log('   Email:', authUsers[0].email);
        console.log('   Created:', authUsers[0].created_at);
      }
    }

    // 2. Check user_profiles table
    console.log('\n📋 Checking user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, user_id, role, assigned_categories, created_at')
      .eq('user_id', authUsers?.[0]?.id || 'not-found');

    if (profilesError) {
      console.log('   ❌ Error querying user_profiles:', profilesError.message);
    } else {
      console.log(`   ✅ Found ${profiles?.length || 0} profiles in user_profiles`);
      if (profiles && profiles.length > 0) {
        profiles.forEach((profile, index) => {
          console.log(`   Profile ${index + 1}:`);
          console.log(`     ID: ${profile.id}`);
          console.log(`     Role: ${profile.role}`);
          console.log(`     Assigned Categories: ${profile.assigned_categories || 'None'}`);
          console.log(`     Created: ${profile.created_at}`);
        });
      }
    }

    // 3. Check user_roles table (legacy)
    console.log('\n🔐 Checking user_roles (legacy)...');
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('id, user_id, role, created_at')
      .eq('user_id', authUsers?.[0]?.id || 'not-found');

    if (userRolesError) {
      console.log('   ❌ Error querying user_roles:', userRolesError.message);
    } else {
      console.log(`   ✅ Found ${userRoles?.length || 0} roles in user_roles`);
      if (userRoles && userRoles.length > 0) {
        userRoles.forEach((role, index) => {
          console.log(`   Role ${index + 1}:`);
          console.log(`     ID: ${role.id}`);
          console.log(`     Role: ${role.role}`);
          console.log(`     Created: ${role.created_at}`);
        });
      }
    }

    // 4. Test hasRole function logic
    console.log('\n🧪 Testing hasRole function logic...');
    const userId = authUsers?.[0]?.id;
    if (userId) {
      // Test admin role check
      const { data: adminProfile, error: adminError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin');

      console.log('   Admin profile check:');
      console.log(`     Error: ${adminError?.message || 'None'}`);
      console.log(`     Data: ${adminProfile?.length || 0} profiles`);
      console.log(`     Has admin role: ${adminProfile && adminProfile.length > 0}`);

      // Test coach role check
      const { data: coachProfile, error: coachError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'coach');

      console.log('   Coach profile check:');
      console.log(`     Error: ${coachError?.message || 'None'}`);
      console.log(`     Data: ${coachProfile?.length || 0} profiles`);
      console.log(`     Has coach role: ${coachProfile && coachProfile.length > 0}`);

      // Test legacy user_roles check
      const { data: legacyAdmin, error: legacyAdminError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin');

      console.log('   Legacy admin roles check:');
      console.log(`     Error: ${legacyAdminError?.message || 'None'}`);
      console.log(`     Data: ${legacyAdmin?.length || 0} roles`);
      console.log(`     Has legacy admin role: ${legacyAdmin && legacyAdmin.length > 0}`);
    }

    // 5. Summary
    console.log('\n📋 SUMMARY:');
    console.log('=' .repeat(60));
    if (profiles && profiles.length > 0) {
      const hasAdminProfile = profiles.some(p => p.role === 'admin');
      const hasCoachProfile = profiles.some(p => p.role === 'coach' || p.role === 'head_coach');
      console.log(`✅ User has admin profile: ${hasAdminProfile}`);
      console.log(`✅ User has coach profile: ${hasCoachProfile}`);
    } else {
      console.log('❌ No user profiles found');
    }
    
    if (userRoles && userRoles.length > 0) {
      const hasLegacyAdmin = userRoles.some(r => r.role === 'admin');
      const hasLegacyCoach = userRoles.some(r => r.role === 'coach');
      console.log(`✅ User has legacy admin role: ${hasLegacyAdmin}`);
      console.log(`✅ User has legacy coach role: ${hasLegacyCoach}`);
    } else {
      console.log('ℹ️  No legacy user roles found');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkUserRoles();
