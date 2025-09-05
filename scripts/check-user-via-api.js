const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserViaAPI() {
  console.log('🔍 Checking user roles via API...');
  console.log('=' .repeat(60));

  try {
    // 1. Test the user-roles API
    console.log('\n🌐 Testing user-roles API...');
    const response = await fetch('http://localhost:3000/api/user-roles');
    
    if (!response.ok) {
      console.log('   ❌ API request failed:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log(`   ✅ API returned ${data.data?.length || 0} users`);
    
    // Find vojtechbe@gmail.com user
    const user = data.data?.find(u => u.email === 'vojtechbe@gmail.com');
    if (user) {
      console.log('\n👤 Found user vojtechbe@gmail.com:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Profile Role: ${user.profile_role || 'None'}`);
      console.log(`   Roles: ${user.roles?.join(', ') || 'None'}`);
      console.log(`   Assigned Categories: ${user.assigned_categories?.join(', ') || 'None'}`);
      
      // Check if user has admin access
      const hasAdminProfile = user.profile_role === 'admin';
      const hasAdminRole = user.roles?.includes('admin');
      const hasCoachProfile = user.profile_role === 'coach' || user.profile_role === 'head_coach';
      const hasCoachRole = user.roles?.includes('coach');
      
      console.log('\n🔐 Access Analysis:');
      console.log(`   Has admin profile: ${hasAdminProfile}`);
      console.log(`   Has admin role: ${hasAdminRole}`);
      console.log(`   Has coach profile: ${hasCoachProfile}`);
      console.log(`   Has coach role: ${hasCoachRole}`);
      console.log(`   Should have admin access: ${hasAdminProfile || hasAdminRole}`);
      console.log(`   Should have coach access: ${hasCoachProfile || hasCoachRole || hasAdminProfile || hasAdminRole}`);
    } else {
      console.log('   ❌ User vojtechbe@gmail.com not found in API response');
    }

    // 2. Test the hasRole function by simulating it
    console.log('\n🧪 Testing hasRole function simulation...');
    if (user) {
      // Simulate the hasRole function logic
      const testAdminRole = async () => {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin');

          if (!profileError && profileData && profileData.length > 0) {
            return true;
          }
          return false;
        } catch (err) {
          console.error('Error in admin role check:', err);
          return false;
        }
      };

      const testCoachRole = async () => {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'coach');

          if (!profileError && profileData && profileData.length > 0) {
            return true;
          }
          return false;
        } catch (err) {
          console.error('Error in coach role check:', err);
          return false;
        }
      };

      const hasAdmin = await testAdminRole();
      const hasCoach = await testCoachRole();
      
      console.log(`   hasRole('admin') result: ${hasAdmin}`);
      console.log(`   hasRole('coach') result: ${hasCoach}`);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkUserViaAPI();
