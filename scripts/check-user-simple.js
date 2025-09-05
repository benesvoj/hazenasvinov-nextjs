const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser(email) {
  console.log(`🔍 Checking user setup for: ${email}`);
  console.log('=' .repeat(60));

  try {
    // 1. Get all users and find the one with matching email
    const { data: allUsers, error: usersError } = await supabase
      .from('user_role_summary')
      .select('*');

    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
      return;
    }

    const user = allUsers.find(u => u.email === email);
    
    if (!user) {
      console.log('❌ User not found in user_role_summary view');
      console.log('   This means the user either:');
      console.log('   - Does not exist in auth.users');
      console.log('   - Has no profile in user_profiles');
      console.log('   - Has no roles in user_roles');
      return;
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user.user_id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Full Name: ${user.full_name || 'Not set'}`);
    console.log(`   Profile Role: ${user.profile_role || 'No role'}`);
    console.log(`   Roles: ${user.roles || 'None'}`);
    console.log(`   Assigned Categories: ${user.assigned_categories || 'None'}`);
    console.log(`   Category Names: ${user.assigned_category_names || 'None'}`);
    console.log(`   Category Codes: ${user.assigned_category_codes || 'None'}`);

    // 2. Check specific tables
    console.log('\n📋 Checking user_profiles table...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.user_id)
      .single();

    if (profileError) {
      console.log('❌ No user profile found:', profileError.message);
    } else {
      console.log('✅ User profile found:');
      console.log(`   Role: ${profile.role || 'No role'}`);
      console.log(`   Club ID: ${profile.club_id || 'Not set'}`);
      console.log(`   Assigned Categories: ${profile.assigned_categories || 'None'}`);
    }

    // 3. Check user_roles table
    console.log('\n🎭 Checking user_roles table...');
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.user_id);

    if (rolesError) {
      console.log('❌ Error checking user roles:', rolesError.message);
    } else if (userRoles && userRoles.length > 0) {
      console.log('✅ User roles found:');
      userRoles.forEach(role => {
        console.log(`   - ${role.role} (created: ${role.created_at})`);
      });
    } else {
      console.log('⚠️  No user roles assigned');
    }

    // 4. Test admin access functions
    console.log('\n🔐 Testing admin access functions...');
    
    const { data: isAdminResult, error: isAdminError } = await supabase
      .rpc('is_admin', { user_uuid: user.user_id });
    
    if (isAdminError) {
      console.log('❌ Error testing is_admin function:', isAdminError.message);
    } else {
      console.log(`   is_admin(): ${isAdminResult ? 'TRUE' : 'FALSE'}`);
    }

    const { data: hasAdminResult, error: hasAdminError } = await supabase
      .rpc('has_admin_access', { user_uuid: user.user_id });
    
    if (hasAdminError) {
      console.log('❌ Error testing has_admin_access function:', hasAdminError.message);
    } else {
      console.log(`   has_admin_access(): ${hasAdminResult ? 'TRUE' : 'FALSE'}`);
    }

    // 5. Diagnosis
    console.log('\n🔧 DIAGNOSIS:');
    console.log('=' .repeat(60));

    const hasProfile = !!profile;
    const hasAdminProfile = profile && profile.role === 'admin';
    const hasAdminRole = userRoles && userRoles.some(r => r.role === 'admin');
    const isAdminFunction = isAdminResult === true;
    const hasAdminAccessFunction = hasAdminResult === true;

    console.log(`   Has Profile: ${hasProfile ? '✅' : '❌'}`);
    console.log(`   Profile Role = Admin: ${hasAdminProfile ? '✅' : '❌'}`);
    console.log(`   Has Admin Role: ${hasAdminRole ? '✅' : '❌'}`);
    console.log(`   is_admin() Function: ${isAdminFunction ? '✅' : '❌'}`);
    console.log(`   has_admin_access() Function: ${hasAdminAccessFunction ? '✅' : '❌'}`);

    if (!hasProfile) {
      console.log('\n❌ MAIN ISSUE: No user profile found');
      console.log('   SOLUTION: Create a user profile');
    } else if (!hasAdminProfile && !hasAdminRole) {
      console.log('\n❌ MAIN ISSUE: User does not have admin role');
      console.log('   SOLUTION: Assign admin role');
    } else if (!isAdminFunction && !hasAdminAccessFunction) {
      console.log('\n❌ ISSUE: Admin functions not working');
      console.log('   SOLUTION: Check function definitions');
    } else {
      console.log('\n✅ User setup looks correct');
      console.log('   If still having issues, check middleware and RLS policies');
    }

    // 6. Fix commands
    console.log('\n💻 SQL TO FIX:');
    console.log('=' .repeat(60));
    
    if (!hasProfile) {
      console.log(`-- Create user profile
INSERT INTO user_profiles (user_id, role, created_at)
VALUES ('${user.user_id}', 'admin', NOW());`);
    } else if (!hasAdminProfile) {
      console.log(`-- Update profile to admin
UPDATE user_profiles 
SET role = 'admin', updated_at = NOW()
WHERE user_id = '${user.user_id}';`);
    }

    if (!hasAdminRole) {
      console.log(`-- Add admin role
INSERT INTO user_roles (user_id, role, created_at)
VALUES ('${user.user_id}', 'admin', NOW())
ON CONFLICT (user_id, role) DO NOTHING;`);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('❌ Please provide an email address');
  console.error('Usage: node scripts/check-user-simple.js vojtechbe@gmail.com');
  process.exit(1);
}

checkUser(email);
