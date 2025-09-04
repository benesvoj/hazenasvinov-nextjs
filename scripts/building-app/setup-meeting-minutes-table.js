const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 Make sure your .env.local file contains these variables.');
  console.error('   You can find them in your Supabase project settings.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupMeetingMinutesTable() {
  try {
    console.log('🚀 Setting up meeting minutes tables...');

    // Check if tables already exist
    const { data: existingMeetingMinutes, error: meetingMinutesError } = await supabase
      .from('meeting_minutes')
      .select('id')
      .limit(1);

    const { data: existingAttendees, error: attendeesError } = await supabase
      .from('meeting_attendees')
      .select('id')
      .limit(1);

    if (!meetingMinutesError && !attendeesError) {
      console.log('✅ Meeting minutes tables already exist');
      return;
    }

    // Read SQL file
    const sqlPath = path.join(__dirname, 'create_meeting_minutes_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📋 Manual setup required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the following SQL:');
    console.log('\n' + sql);
    console.log('\n4. After running the SQL, come back and run this script again to verify setup.');

    // Test the tables
    const { data: testData, error: testError } = await supabase
      .from('meeting_minutes')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Error testing meeting minutes table:', testError);
    } else {
      console.log('✅ Meeting minutes table is working correctly');
    }

    // Test attendees table
    const { data: attendeesTestData, error: attendeesTestError } = await supabase
      .from('meeting_attendees')
      .select('id')
      .limit(1);

    if (attendeesTestError) {
      console.error('❌ Error testing meeting attendees table:', attendeesTestError);
    } else {
      console.log('✅ Meeting attendees table is working correctly');
    }

    console.log('\n🎉 Meeting minutes tables setup completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Navigate to /admin/meeting-minutes to start managing meeting minutes');
    console.log('2. Navigate to /coaches/meeting-minutes to view meeting minutes (read-only)');
    console.log('3. Create your first meeting minutes entry');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupMeetingMinutesTable();
}

module.exports = { setupMeetingMinutesTable };
