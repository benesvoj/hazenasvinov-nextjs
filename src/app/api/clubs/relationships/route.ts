import {NextResponse} from 'next/server';

import {createClient} from '@/utils/supabase/server';

export async function GET(request: Request, {params}: {params: {clubId: string}}) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {data, error} = await supabase
      .from('member_club_relationships')
      .select('*')
      .eq('club_id', params.clubId);

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
