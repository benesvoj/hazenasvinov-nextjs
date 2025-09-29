import {NextResponse} from 'next/server';

import supabaseAdmin from '@/utils/supabase/admin';

export async function GET() {
  try {
    const {data, error} = await supabaseAdmin
      .from('member_functions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', {ascending: true})
      .order('display_name', {ascending: true});

    if (error) {
      console.error('Error fetching member functions:', error);
      return NextResponse.json({error: 'Failed to fetch member functions'}, {status: 500});
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error fetching member functions:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
