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

async function executeSQL() {
  try {
    console.log('🚀 Executing function cleanup...');
    
    // Step 1: Check existing functions
    console.log('🔍 Checking existing functions...');
    
    const { data: existingFunctions, error: checkError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, specific_name, routine_type')
      .eq('routine_schema', 'public')
      .in('routine_name', ['get_training_sessions', 'get_attendance_summary', 'get_attendance_records']);
    
    if (checkError) {
      console.error('❌ Error checking functions:', checkError);
      return;
    }
    
    console.log('📋 Existing functions:', existingFunctions);
    
    // Step 2: Drop functions using direct SQL execution
    console.log('🗑️  Dropping existing functions...');
    
    // Drop get_training_sessions functions
    for (const func of existingFunctions?.filter(f => f.routine_name === 'get_training_sessions') || []) {
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: `DROP FUNCTION IF EXISTS ${func.specific_name} CASCADE;` 
        });
        if (error) {
          console.log(`⚠️  Could not drop ${func.specific_name}:`, error.message);
        } else {
          console.log(`✅ Dropped ${func.specific_name}`);
        }
      } catch (err) {
        console.log(`⚠️  Error dropping ${func.specific_name}:`, err);
      }
    }
    
    // Drop get_attendance_summary functions
    for (const func of existingFunctions?.filter(f => f.routine_name === 'get_attendance_summary') || []) {
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: `DROP FUNCTION IF EXISTS ${func.specific_name} CASCADE;` 
        });
        if (error) {
          console.log(`⚠️  Could not drop ${func.specific_name}:`, error.message);
        } else {
          console.log(`✅ Dropped ${func.specific_name}`);
        }
      } catch (err) {
        console.log(`⚠️  Error dropping ${func.specific_name}:`, err);
      }
    }
    
    // Drop get_attendance_records functions
    for (const func of existingFunctions?.filter(f => f.routine_name === 'get_attendance_records') || []) {
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: `DROP FUNCTION IF EXISTS ${func.specific_name} CASCADE;` 
        });
        if (error) {
          console.log(`⚠️  Could not drop ${func.specific_name}:`, error.message);
        } else {
          console.log(`✅ Dropped ${func.specific_name}`);
        }
      } catch (err) {
        console.log(`⚠️  Error dropping ${func.specific_name}:`, err);
      }
    }
    
    console.log('✅ Function cleanup completed!');
    console.log('📝 Please run the complete_function_cleanup.sql script manually in Supabase SQL Editor');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/nsyfksvtkjmyhvdmxqsi/sql');
    
  } catch (error) {
    console.error('❌ Script execution failed:', error);
  }
}

executeSQL();
