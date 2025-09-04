const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMeetingAttendeesForeignKey() {
  console.log('🔧 Fixing meeting_attendees foreign key constraint...');
  
  try {
    // Read the SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, 'fix_meeting_attendees_foreign_key.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      console.log('\n📋 Manual SQL execution required:');
      console.log('Please run the following SQL in your Supabase SQL Editor:');
      console.log('─'.repeat(60));
      console.log(sql);
      console.log('─'.repeat(60));
      return;
    }
    
    console.log('✅ Foreign key constraint updated successfully!');
    console.log('   meeting_attendees.user_id now references members.id');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Manual SQL execution required:');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, 'fix_meeting_attendees_foreign_key.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
  }
}

fixMeetingAttendeesForeignKey();
