import {NextRequest, NextResponse} from 'next/server';

import {SupabaseClient} from '@supabase/supabase-js';

import {withAuth, withPublicAccess} from '@/utils/supabase/apiHelpers';

// GET - Fetch all main partners
export async function GET() {
  return withPublicAccess(async (supabase: SupabaseClient) => {
    const {data, error} = await supabase
      .from('main_partners')
      .select('*')
      .order('created_at', {ascending: false});

    if (error) {
      console.error('Error fetching main partners:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({data: data || []});
  });
}

// POST - Create new main partner
export async function POST(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const body = await request.json();

    const {data, error} = await supabase.from('main_partners').insert([body]).select().single();

    if (error) {
      console.error('Error creating main partner:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({data}, {status: 201});
  });
}
