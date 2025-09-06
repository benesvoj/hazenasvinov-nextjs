import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Test basic Supabase connection
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    return NextResponse.json({
      success: true,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? 'present' : 'missing',
      hasUser: !!user,
      userError: userError?.message || null,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? 'present' : 'missing',
      environment: process.env.NODE_ENV
    }, { status: 500 });
  }
}
