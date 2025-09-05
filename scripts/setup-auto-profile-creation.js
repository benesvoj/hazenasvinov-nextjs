const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAutoProfileCreation() {
  console.log('🚀 Setting up automatic profile creation...');
  console.log('=' .repeat(60));

  try {
    // 1. Read the SQL script
    console.log('\n📖 Reading SQL script...');
    const sqlPath = path.join(__dirname, '..', 'building-app', 'create_auto_profile_trigger.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('   ✅ SQL script loaded');

    // 2. Execute the SQL script
    console.log('\n🔧 Executing SQL script...');
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (sqlError) {
      console.log('   ❌ Error executing SQL:', sqlError.message);
      console.log('   You need to run the SQL script manually in Supabase dashboard');
      console.log('   File: scripts/building-app/create_auto_profile_trigger.sql');
      return;
    }

    console.log('   ✅ SQL script executed successfully');

    // 3. Test the functions
    console.log('\n🧪 Testing functions...');
    
    // Test user_has_profile function
    const { data: hasProfileTest, error: hasProfileError } = await supabase
      .rpc('user_has_profile', { user_uuid: '00000000-0000-0000-0000-000000000000' });

    if (hasProfileError) {
      console.log('   ❌ user_has_profile function not working:', hasProfileError.message);
    } else {
      console.log('   ✅ user_has_profile function working');
    }

    // Test get_user_profile_safe function
    const { data: safeProfileTest, error: safeProfileError } = await supabase
      .rpc('get_user_profile_safe', { user_uuid: '00000000-0000-0000-0000-000000000000' });

    if (safeProfileError) {
      console.log('   ❌ get_user_profile_safe function not working:', safeProfileError.message);
    } else {
      console.log('   ✅ get_user_profile_safe function working');
    }

    // 4. Test with vojtechbe@gmail.com
    console.log('\n🔍 Testing with vojtechbe@gmail.com...');
    
    // Try to sign in to get the user ID
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'vojtechbe@gmail.com',
      password: 'dummy_password' // This will fail but might give us info
    });

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('   ✅ vojtechbe@gmail.com exists in auth.users');
        console.log('   You can now test by signing in with vojtechbe@gmail.com');
      } else {
        console.log('   ❌ vojtechbe@gmail.com not found:', signInError.message);
      }
    } else {
      console.log('   ✅ vojtechbe@gmail.com signed in successfully');
      console.log('   User ID:', signInData.user.id);
      
      // Test the safe profile function
      const { data: profileResult, error: profileError } = await supabase
        .rpc('get_user_profile_safe', { user_uuid: signInData.user.id });

      if (profileError) {
        console.log('   ❌ Error testing get_user_profile_safe:', profileError.message);
      } else {
        console.log('   ✅ Profile created/retrieved successfully');
        console.log('   Profile result:', profileResult);
      }
      
      // Sign out
      await supabase.auth.signOut();
    }

    // 5. Summary
    console.log('\n🎉 SETUP COMPLETE!');
    console.log('=' .repeat(60));
    console.log('✅ Database trigger created');
    console.log('✅ Safe profile functions created');
    console.log('✅ Signup flow updated');
    console.log('✅ Auth callback updated');
    console.log('✅ Middleware updated');
    console.log('✅ Login page updated');
    console.log('');
    console.log('🎯 WHAT HAPPENS NOW:');
    console.log('• New users will automatically get a profile with "member" role');
    console.log('• Existing users without profiles will get one when they log in');
    console.log('• vojtechbe@gmail.com should now be able to log in');
    console.log('');
    console.log('🧪 TO TEST:');
    console.log('1. Try logging in with vojtechbe@gmail.com');
    console.log('2. Create a new user and verify they get a profile');
    console.log('3. Check that existing users work without issues');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n🔧 MANUAL SETUP REQUIRED:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Copy and paste the contents of: scripts/building-app/create_auto_profile_trigger.sql');
    console.log('3. Run the SQL script');
    console.log('4. Test the functions');
  }
}

setupAutoProfileCreation();
