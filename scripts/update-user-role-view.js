const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

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

async function updateUserRoleView() {
  console.log('🚀 Updating user_role_summary view...');

  try {
    const updateViewSQL = `
-- Update view for user role summary to prevent duplicates
CREATE OR REPLACE VIEW user_role_summary AS
SELECT 
    u.id as user_id,
    u.email,
    COALESCE(
        up.full_name,
        u.raw_user_meta_data->>'full_name',
        u.email
    ) as full_name,
    up.role as profile_role, -- Keep existing role for backward compatibility
    COALESCE(array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') as roles,
    COALESCE(array_agg(DISTINCT cc.category_id) FILTER (WHERE cc.category_id IS NOT NULL), '{}') as assigned_categories,
    COALESCE(array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), '{}') as assigned_category_names,
    COALESCE(array_agg(DISTINCT c.code) FILTER (WHERE c.code IS NOT NULL), '{}') as assigned_category_codes
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN coach_categories cc ON u.id = cc.user_id
LEFT JOIN categories c ON cc.category_id = c.id
GROUP BY u.id, u.email, up.full_name, u.raw_user_meta_data, up.role;
    `;

    console.log('📝 SQL to update the view:');
    console.log('='.repeat(80));
    console.log(updateViewSQL);
    console.log('='.repeat(80));
    
    console.log('\n📋 Manual Update Required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL above');
    console.log('4. Execute the SQL');
    
    console.log('\n✅ After updating the view:');
    console.log('   • Duplicate users will be eliminated');
    console.log('   • React key errors will be resolved');
    console.log('   • User roles page will display correctly');

  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

// Run the update
updateUserRoleView();
