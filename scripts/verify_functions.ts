import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyFunctions() {
  try {
    console.log('🔍 Checking existing functions...');
    
    const { data: functions, error } = await supabase
      .from('information_schema.routines')
      .select('routine_name, specific_name, routine_type, data_type')
      .eq('routine_schema', 'public')
      .in('routine_name', ['get_training_sessions', 'get_attendance_summary', 'get_attendance_records'])
      .order('routine_name');
    
    if (error) {
      console.error('❌ Error checking functions:', error);
      return;
    }
    
    console.log('📋 Current functions:');
    console.table(functions);
    
    if (functions && functions.length > 0) {
      console.log('\n⚠️  Functions still exist. Please run the cleanup script manually.');
      console.log('🔗 Go to: https://supabase.com/dashboard/project/nsyfksvtkjmyhvdmxqsi/sql');
      console.log('📄 Use the script: scripts/complete_function_cleanup.sql');
    } else {
      console.log('\n✅ No conflicting functions found!');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyFunctions();
