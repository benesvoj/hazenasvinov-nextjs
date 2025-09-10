const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMembersData() {
  try {
    console.log('🔍 Checking members data...');
    
    // Check if members table exists
    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching members:', error);
      return;
    }
    
    console.log('✅ Members table accessible');
    console.log(`📊 Found ${members?.length || 0} members in database`);
    
    if (members && members.length > 0) {
      console.log('📋 Sample members:');
      members.forEach((member, index) => {
        console.log(`  ${index + 1}. ${member.name} ${member.surname} (${member.sex}) - Category: ${member.category_id || 'N/A'}`);
      });
    } else {
      console.log('⚠️  No members found in database');
      console.log('💡 You may need to add some members or import data');
    }
    
    // Check categories table
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, code')
      .limit(5);
    
    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError);
    } else {
      console.log(`📊 Found ${categories?.length || 0} categories in database`);
      if (categories && categories.length > 0) {
        console.log('📋 Available categories:');
        categories.forEach((category, index) => {
          console.log(`  ${index + 1}. ${category.name} (${category.code}) - ID: ${category.id}`);
        });
      }
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkMembersData();
