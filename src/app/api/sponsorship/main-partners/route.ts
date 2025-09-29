import {NextRequest, NextResponse} from 'next/server';

import {createClient} from '@/utils/supabase/server';

// GET - Fetch all main partners
export async function GET() {
  try {
    const supabase = await createClient();

    const {data, error} = await supabase
      .from('main_partners')
      .select('*')
      .order('created_at', {ascending: false});

    if (error) {
      console.error('Error fetching main partners:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({data: data || []});
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}

// POST - Create new main partner
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {data, error} = await supabase.from('main_partners').insert([body]).select().single();

    if (error) {
      console.error('Error creating main partner:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({data}, {status: 201});
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
