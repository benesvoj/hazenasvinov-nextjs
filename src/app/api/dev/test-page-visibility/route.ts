import {NextResponse} from 'next/server';

import {supabaseServerClient} from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await supabaseServerClient();

    console.log('Testing Supabase connection...');

    // Try to check if the page_visibility table exists by attempting a simple query
    const {data, error} = await supabase.from('page_visibility').select('count').limit(1);

    if (error) {
      console.error('Error accessing page_visibility table:', error);

      // Check if it's a table not found error
      if (error.code === '42P01') {
        // PostgreSQL table not found error
        return NextResponse.json(
          {
            error: 'Table page_visibility does not exist',
            message: 'Please run the setup script first: npm run setup:page-visibility',
            code: 'TABLE_NOT_FOUND',
          },
          {status: 404}
        );
      }

      return NextResponse.json(
        {
          error: 'Database error',
          details: error.message,
          code: error.code,
        },
        {status: 500}
      );
    }

    return NextResponse.json({
      message: 'Table exists and is accessible',
      data: data,
      error: null,
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      {
        error: 'Connection error',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'CONNECTION_ERROR',
      },
      {status: 500}
    );
  }
}
