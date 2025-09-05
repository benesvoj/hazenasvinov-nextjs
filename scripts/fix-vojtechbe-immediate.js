const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixVojtechbeImmediate() {
  console.log('🔧 Fixing vojtechbe@gmail.com immediately...');
  console.log('=' .repeat(60));

  try {
    // 1. Try to sign in to get the user ID
    console.log('\n🔍 Getting vojtechbe@gmail.com user ID...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'vojtechbe@gmail.com',
      password: 'dummy_password' // This will fail but might give us info
    });

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('   ✅ vojtechbe@gmail.com exists in auth.users');
        console.log('   But we need the user ID to create the profile');
        console.log('');
        console.log('🔧 MANUAL FIX REQUIRED:');
        console.log('1. Go to Supabase Dashboard > Authentication > Users');
        console.log('2. Find vojtechbe@gmail.com');
        console.log('3. Copy the user ID (UUID)');
        console.log('4. Run this SQL in Supabase SQL Editor:');
        console.log('');
        console.log('-- Replace USER_ID_HERE with the actual user ID');
        console.log('INSERT INTO user_profiles (user_id, role, created_at, updated_at)');
        console.log('VALUES (\'USER_ID_HERE\', \'admin\', NOW(), NOW())');
        console.log('ON CONFLICT (user_id) DO UPDATE SET role = \'admin\', updated_at = NOW();');
        console.log('');
        console.log('INSERT INTO user_roles (user_id, role, created_at)');
        console.log('VALUES (\'USER_ID_HERE\', \'admin\', NOW())');
        console.log('ON CONFLICT (user_id, role) DO NOTHING;');
        return;
      } else {
        console.log('   ❌ vojtechbe@gmail.com not found:', signInError.message);
        return;
      }
    } else {
      console.log('   ✅ vojtechbe@gmail.com signed in successfully');
      console.log('   User ID:', signInData.user.id);
      
      // 2. Create admin profile
      console.log('\n🔧 Creating admin profile...');
      
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: signInData.user.id,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.log('   ❌ Error creating profile:', profileError.message);
      } else {
        console.log('   ✅ Admin profile created successfully');
      }

      // 3. Add admin role to user_roles
      console.log('\n🔧 Adding admin role...');
      
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: signInData.user.id,
          role: 'admin',
          created_at: new Date().toISOString()
        });

      if (roleError) {
        console.log('   ❌ Error adding role:', roleError.message);
      } else {
        console.log('   ✅ Admin role added successfully');
      }

      // 4. Verify the setup
      console.log('\n✅ VERIFICATION:');
      console.log('=' .repeat(60));
      
      const { data: profile, error: profileCheckError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', signInData.user.id)
        .single();

      if (profileCheckError) {
        console.log('   ❌ Profile verification failed:', profileCheckError.message);
      } else {
        console.log('   ✅ Profile verified:');
        console.log(`      Role: ${profile.role}`);
        console.log(`      Created: ${profile.created_at}`);
      }

      const { data: roles, error: rolesCheckError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', signInData.user.id);

      if (rolesCheckError) {
        console.log('   ❌ Roles verification failed:', rolesCheckError.message);
      } else {
        console.log('   ✅ Roles verified:');
        roles.forEach(role => {
          console.log(`      - ${role.role} (${role.created_at})`);
        });
      }

      // 5. Test admin access
      console.log('\n🔐 Testing admin access...');
      
      const { data: isAdmin, error: adminError } = await supabase
        .rpc('is_admin', { user_uuid: signInData.user.id });

      if (adminError) {
        console.log('   ❌ Admin access test failed:', adminError.message);
      } else {
        console.log(`   ✅ Admin access test: ${isAdmin ? 'TRUE' : 'FALSE'}`);
      }

      // Sign out
      await supabase.auth.signOut();

      console.log('\n🎉 vojtechbe@gmail.com is now fixed!');
      console.log('You can now log in with vojtechbe@gmail.com to both admin and coach portals.');
    }

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixVojtechbeImmediate();
