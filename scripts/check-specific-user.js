const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecificUser(email) {
  console.log(`🔍 Checking user setup for: ${email}`);
  console.log('=' .repeat(60));

  try {
    // 1. Check if user exists in auth.users by querying the users table directly
    const { data: users, error: authError } = await supabase
      .from('auth.users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (authError) {
      console.log('❌ User not found in auth.users:', authError.message);
      return;
    }

    if (!users) {
      console.log('❌ User not found in auth.users');
      return;
    }

    const user = users;
    console.log('✅ User found in auth.users:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   Created: ${user.created_at}`);
    console.log(`   Last Sign In: ${user.last_sign_in_at || 'Never'}`);

    // 2. Check user_profiles table
    console.log('\n📋 Checking user_profiles table...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.log('❌ No user profile found:', profileError.message);
      console.log('   This is likely the main issue!');
    } else {
      console.log('✅ User profile found:');
      console.log(`   Role: ${profile.role || 'No role'}`);
      console.log(`   Club ID: ${profile.club_id || 'Not set'}`);
      console.log(`   Assigned Categories: ${profile.assigned_categories || 'None'}`);
      console.log(`   Created: ${profile.created_at}`);
    }

    // 3. Check user_roles table (legacy system)
    console.log('\n🎭 Checking user_roles table (legacy)...');
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);

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

    // 4. Check coach_categories table (legacy system)
    console.log('\n🏃 Checking coach_categories table (legacy)...');
    const { data: coachCategories, error: categoriesError } = await supabase
      .from('coach_categories')
      .select(`
        *,
        categories(name, code)
      `)
      .eq('user_id', user.id);

    if (categoriesError) {
      console.log('❌ Error checking coach categories:', categoriesError.message);
    } else if (coachCategories && coachCategories.length > 0) {
      console.log('✅ Coach categories found:');
      coachCategories.forEach(cat => {
        console.log(`   - ${cat.categories.name} (${cat.categories.code})`);
      });
    } else {
      console.log('⚠️  No coach categories assigned');
    }

    // 5. Check user_role_summary view
    console.log('\n📊 Checking user_role_summary view...');
    const { data: summary, error: summaryError } = await supabase
      .from('user_role_summary')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (summaryError) {
      console.log('❌ Error checking user role summary:', summaryError.message);
    } else if (summary) {
      console.log('✅ User role summary:');
      console.log(`   Full Name: ${summary.full_name || 'Not set'}`);
      console.log(`   Profile Role: ${summary.profile_role || 'No role'}`);
      console.log(`   Roles: ${summary.roles || 'None'}`);
      console.log(`   Assigned Categories: ${summary.assigned_categories || 'None'}`);
      console.log(`   Category Names: ${summary.assigned_category_names || 'None'}`);
      console.log(`   Category Codes: ${summary.assigned_category_codes || 'None'}`);
    }

    // 6. Test admin access functions
    console.log('\n🔐 Testing admin access functions...');
    
    // Test is_admin function
    const { data: isAdminResult, error: isAdminError } = await supabase
      .rpc('is_admin', { user_uuid: user.id });
    
    if (isAdminError) {
      console.log('❌ Error testing is_admin function:', isAdminError.message);
    } else {
      console.log(`   is_admin(): ${isAdminResult ? 'TRUE' : 'FALSE'}`);
    }

    // Test has_admin_access function
    const { data: hasAdminResult, error: hasAdminError } = await supabase
      .rpc('has_admin_access', { user_uuid: user.id });
    
    if (hasAdminError) {
      console.log('❌ Error testing has_admin_access function:', hasAdminError.message);
    } else {
      console.log(`   has_admin_access(): ${hasAdminResult ? 'TRUE' : 'FALSE'}`);
    }

    // 7. Diagnosis and recommendations
    console.log('\n🔧 DIAGNOSIS & RECOMMENDATIONS:');
    console.log('=' .repeat(60));

    if (!profile) {
      console.log('❌ MAIN ISSUE: No user profile found');
      console.log('   SOLUTION: Create a user profile with admin role');
      console.log('   Run: npm run setup:initial-admin');
      console.log('   Or manually insert into user_profiles table');
    } else if (profile.role !== 'admin' && (!userRoles || !userRoles.some(r => r.role === 'admin'))) {
      console.log('❌ MAIN ISSUE: User does not have admin role');
      console.log('   SOLUTION: Assign admin role to user');
      console.log('   Update user_profiles.role to "admin"');
      console.log('   Or add admin role to user_roles table');
    } else if (!user.email_confirmed_at) {
      console.log('❌ ISSUE: Email not confirmed');
      console.log('   SOLUTION: User needs to confirm their email');
      console.log('   Check email inbox for confirmation link');
    } else {
      console.log('✅ User setup looks correct');
      console.log('   If still having issues, check:');
      console.log('   - RLS policies');
      console.log('   - Middleware configuration');
      console.log('   - Browser console for errors');
    }

    // 8. Provide SQL to fix the issue
    console.log('\n💻 SQL TO FIX THE ISSUE:');
    console.log('=' .repeat(60));
    
    if (!profile) {
      console.log(`-- Create user profile with admin role
INSERT INTO user_profiles (user_id, role, created_at)
VALUES ('${user.id}', 'admin', NOW());`);
    } else if (profile.role !== 'admin') {
      console.log(`-- Update user profile to admin role
UPDATE user_profiles 
SET role = 'admin', updated_at = NOW()
WHERE user_id = '${user.id}';`);
    }

    if (!userRoles || !userRoles.some(r => r.role === 'admin')) {
      console.log(`-- Add admin role to user_roles table
INSERT INTO user_roles (user_id, role, created_at)
VALUES ('${user.id}', 'admin', NOW())
ON CONFLICT (user_id, role) DO NOTHING;`);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.error('Usage: node scripts/check-specific-user.js vojtechbe@gmail.com');
  process.exit(1);
}

checkSpecificUser(email);
