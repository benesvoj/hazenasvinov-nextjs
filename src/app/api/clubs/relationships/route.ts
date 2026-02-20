import {NextResponse} from 'next/server';

import {supabaseServerClient} from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await supabaseServerClient();

    // Check authentication
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    // Get clubId from query params
    const {searchParams} = new URL(request.url);
    const clubId = searchParams.get('clubId');

    let query = supabase.from('member_club_relationships').select('*');

    // Filter by clubId if provided
    if (clubId) {
      query = query.eq('club_id', clubId);
    }

    const {data, error} = await query;

    if (error) {
      console.error('Error fetching clubs relationships:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({data, error: null});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}
