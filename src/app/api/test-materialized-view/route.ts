import {NextRequest, NextResponse} from 'next/server';

import {createClient} from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if the materialized view exists and what columns it has
    const {data: viewInfo, error: viewError} = await supabase.rpc('exec_sql', {
      sql: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'own_club_matches' 
          ORDER BY ordinal_position;
        `,
    });

    if (viewError) {
      return NextResponse.json(
        {
          error: 'Failed to check materialized view structure',
          details: viewError.message,
        },
        {status: 500}
      );
    }

    // Check if the materialized view has any data
    const {data: sampleData, error: dataError} = await supabase
      .from('own_club_matches')
      .select('*')
      .limit(1);

    if (dataError) {
      return NextResponse.json(
        {
          error: 'Failed to query materialized view',
          details: dataError.message,
        },
        {status: 500}
      );
    }

    // Check if category columns exist in the sample data
    const hasCategoryInfo =
      sampleData && sampleData.length > 0 && sampleData[0].category_name !== undefined;

    return NextResponse.json({
      success: true,
      viewExists: true,
      columns: viewInfo,
      sampleData: sampleData?.[0] || null,
      hasCategoryInfo,
      categoryColumns: sampleData?.[0]
        ? Object.keys(sampleData[0]).filter((key) => key.includes('category'))
        : [],
      seasonColumns: sampleData?.[0]
        ? Object.keys(sampleData[0]).filter((key) => key.includes('season'))
        : [],
    });
  } catch (error) {
    console.error('Error testing materialized view:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500}
    );
  }
}
