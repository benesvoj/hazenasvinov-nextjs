import {NextResponse} from 'next/server';

import {createClient} from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check basic connectivity
    const {data: configData, error: configError} = await supabase
      .from('club_config')
      .select('count')
      .limit(1);

    // Check if page_visibility table exists
    const {data: pageData, error: pageError} = await supabase
      .from('page_visibility')
      .select('count')
      .limit(1);

    const status: any = {
      timestamp: new Date().toISOString(),
      supabase: {
        connected: !configError,
        club_config_table: !configError ? 'exists' : 'missing',
        page_visibility_table: !pageError ? 'exists' : 'missing',
      },
      errors: {
        club_config: configError?.message || null,
        page_visibility: pageError?.message || null,
      },
    };

    if (pageError && pageError.code === '42P01') {
      status.page_visibility_table = 'missing';
      status.setup_required = true;
      status.setup_instructions = [
        'Run: npm run setup:page-visibility',
        'Or manually execute: scripts/setup_page_visibility_manual.sql in Supabase SQL Editor',
      ];
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error in status endpoint:', error);
    return NextResponse.json(
      {
        error: 'Status check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      {status: 500}
    );
  }
}
