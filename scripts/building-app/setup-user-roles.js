const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
} else {
  require('dotenv').config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupUserRoles() {
  console.log('🚀 Setting up user roles system...');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_user_roles_system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📋 Manual Setup Required:');
    console.log('The automated SQL execution is not available. Please run the SQL manually:');
    console.log('\n1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of: scripts/create_user_roles_system.sql');
    console.log('4. Execute the SQL');
    
    console.log('\n📝 SQL Content:');
    console.log('='.repeat(80));
    console.log(sql);
    console.log('='.repeat(80));
    
    console.log('\n✅ After running the SQL manually, the following will be created:');
    console.log('   • user_roles table for role assignments');
    console.log('   • coach_categories table for coach category assignments');
    console.log('   • RLS policies for security');
    console.log('   • Helper functions for role checking');
    console.log('   • user_role_summary view for easy querying');
    
    console.log('\n🎯 Next steps:');
    console.log('   1. Assign admin role to existing admin users');
    console.log('   2. Create coach users and assign categories');
    console.log('   3. Update authentication logic in the app');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupUserRoles();
