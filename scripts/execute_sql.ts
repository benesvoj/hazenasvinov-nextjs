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
    
    // Step 1: Drop all existing functions
    console.log('🗑️  Dropping existing functions...');
    
    const dropQuery = `
      DO $$ 
      DECLARE
          func_record RECORD;
      BEGIN
          -- Find and drop all get_training_sessions functions
          FOR func_record IN 
              SELECT routine_name, specific_name
              FROM information_schema.routines 
              WHERE routine_schema = 'public' 
              AND routine_name = 'get_training_sessions'
          LOOP
              EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.specific_name || ' CASCADE';
              RAISE NOTICE 'Dropped function: %', func_record.specific_name;
          END LOOP;
          
          -- Find and drop all get_attendance_summary functions
          FOR func_record IN 
              SELECT routine_name, specific_name
              FROM information_schema.routines 
              WHERE routine_schema = 'public' 
              AND routine_name = 'get_attendance_summary'
          LOOP
              EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.specific_name || ' CASCADE';
              RAISE NOTICE 'Dropped function: %', func_record.specific_name;
          END LOOP;
          
          -- Find and drop all get_attendance_records functions
          FOR func_record IN 
              SELECT routine_name, specific_name
              FROM information_schema.routines 
              WHERE routine_schema = 'public' 
              AND routine_name = 'get_attendance_records'
          LOOP
              EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.specific_name || ' CASCADE';
              RAISE NOTICE 'Dropped function: %', func_record.specific_name;
          END LOOP;
          
          RAISE NOTICE 'All function variations dropped successfully';
      END $$;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { 
      sql_query: dropQuery 
    });
    
    if (dropError) {
      console.error('❌ Error dropping functions:', dropError);
      return;
    }
    
    console.log('✅ Functions dropped successfully');
    
    // Step 2: Create new functions
    console.log('🔨 Creating new functions...');
    
    const createFunctionsQuery = `
      -- Create new get_training_sessions function that uses category_id
      CREATE OR REPLACE FUNCTION get_training_sessions(
          p_category_id UUID,
          p_season_id UUID,
          p_user_id UUID
      )
      RETURNS TABLE (
          id UUID,
          title VARCHAR(200),
          description TEXT,
          session_date DATE,
          session_time TIME,
          location VARCHAR(200),
          coach_id UUID,
          created_at TIMESTAMP WITH TIME ZONE
      ) AS $$
      BEGIN
          RETURN QUERY
          SELECT 
              ts.id,
              ts.title,
              ts.description,
              ts.session_date,
              ts.session_time,
              ts.location,
              ts.coach_id,
              ts.created_at
          FROM training_sessions ts
          WHERE ts.category_id = p_category_id 
          AND ts.season_id = p_season_id
          AND (
              -- Check if user is a coach for this category
              ts.coach_id = p_user_id
              OR
              -- Check if user has coach role for this category
              EXISTS (
                  SELECT 1 FROM user_roles ur
                  JOIN categories c ON c.id = p_category_id
                  WHERE ur.user_id = p_user_id 
                  AND ur.assigned_category_codes @> ARRAY[c.code]
                  AND ur.role = 'coach'
              )
              OR
              -- Check if user is admin
              EXISTS (
                  SELECT 1 FROM user_roles ur
                  WHERE ur.user_id = p_user_id 
                  AND ur.role = 'admin'
              )
          )
          ORDER BY ts.session_date DESC, ts.session_time DESC;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql_query: createFunctionsQuery 
    });
    
    if (createError) {
      console.error('❌ Error creating functions:', createError);
      return;
    }
    
    console.log('✅ Functions created successfully');
    
    // Step 3: Grant permissions
    console.log('🔐 Granting permissions...');
    
    const grantQuery = `
      GRANT EXECUTE ON FUNCTION get_training_sessions TO authenticated;
      GRANT EXECUTE ON FUNCTION get_attendance_summary TO authenticated;
      GRANT EXECUTE ON FUNCTION get_attendance_records TO authenticated;
    `;
    
    const { error: grantError } = await supabase.rpc('exec_sql', { 
      sql_query: grantQuery 
    });
    
    if (grantError) {
      console.error('❌ Error granting permissions:', grantError);
    } else {
      console.log('✅ Permissions granted successfully');
    }
    
    // Step 4: Verify functions
    console.log('🔍 Verifying functions...');
    
    const { data: functions, error: verifyError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type, data_type')
      .eq('routine_schema', 'public')
      .in('routine_name', ['get_training_sessions', 'get_attendance_summary', 'get_attendance_records']);
    
    if (verifyError) {
      console.error('❌ Error verifying functions:', verifyError);
    } else {
      console.log('✅ Functions verified:', functions);
    }
    
    console.log('🎉 Function cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Script execution failed:', error);
  }
}

executeSQL();
