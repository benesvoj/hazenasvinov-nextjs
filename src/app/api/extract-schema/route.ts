import {NextResponse} from 'next/server';

import {createClient} from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const {sql} = await request.json();

    if (!sql) {
      return NextResponse.json({error: 'SQL query is required'}, {status: 400});
    }

    const supabase = await createClient();

    // Execute the custom SQL query
    const {data, error} = await supabase.rpc('exec_sql', {sql_query: sql});

    if (error) {
      console.error('Error executing SQL:', error);
      return NextResponse.json({error: error.message, details: error}, {status: 500});
    }

    return NextResponse.json({
      success: true,
      data: data,
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error executing SQL:', error);
    return NextResponse.json({error: 'Failed to execute SQL'}, {status: 500});
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all tables and their columns
    const {data: tables, error: tablesError} = await supabase
      .from('information_schema.tables')
      .select(
        `
        table_name,
        columns:information_schema.columns(
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          ordinal_position
        )
      `
      )
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')
      .not('table_name', 'like', 'pg_%')
      .not('table_name', 'like', 'sql_%');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return NextResponse.json({error: 'Failed to fetch tables'}, {status: 500});
    }

    // Get all functions
    const {data: functions, error: functionsError} = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type, data_type, routine_definition')
      .eq('routine_schema', 'public');

    if (functionsError) {
      console.error('Error fetching functions:', functionsError);
    }

    // Get all indexes
    const {data: indexes, error: indexesError} = await supabase
      .from('pg_indexes')
      .select('schemaname, tablename, indexname, indexdef')
      .eq('schemaname', 'public');

    if (indexesError) {
      console.error('Error fetching indexes:', indexesError);
    }

    return NextResponse.json({
      tables: tables || [],
      functions: functions || [],
      indexes: indexes || [],
      extracted_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error extracting schema:', error);
    return NextResponse.json({error: 'Failed to extract schema'}, {status: 500});
  }
}
