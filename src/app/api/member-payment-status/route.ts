import {NextRequest, NextResponse} from 'next/server';

import {createClient} from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get('year') || new Date().getFullYear();

  try {
    // Fetch from the view
    const {data, error} = await supabase
      .from('member_fee_status')
      .select('*')
      .order('surname', {ascending: true});

    if (error) throw error;

    return NextResponse.json({data}, {status: 200});
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json({error: 'Failed to fetch payment status'}, {status: 500});
  }
}
