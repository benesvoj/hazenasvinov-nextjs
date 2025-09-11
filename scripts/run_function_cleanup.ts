import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runFunctionCleanup() {
  try {
    console.log('🚀 Starting function cleanup...');
    
    // Read the SQL script
    const sqlScript = fs.readFileSync(
      path.join(__dirname, 'complete_function_cleanup.sql'), 
      'utf8'
    );
    
    console.log('📄 Executing SQL script...');
    
    // Execute the script
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sqlScript 
    });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      return;
    }
    
    console.log('✅ Function cleanup completed successfully!');
    console.log('📊 Results:', data);
    
    // Verify functions were created
    console.log('\n🔍 Verifying functions...');
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type, data_type')
      .eq('routine_schema', 'public')
      .in('routine_name', ['get_training_sessions', 'get_attendance_summary', 'get_attendance_records']);
    
    if (funcError) {
      console.error('❌ Error verifying functions:', funcError);
    } else {
      console.log('✅ Functions verified:', functions);
    }
    
  } catch (error) {
    console.error('❌ Script execution failed:', error);
  }
}

runFunctionCleanup();
