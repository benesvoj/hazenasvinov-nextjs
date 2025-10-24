import {NextRequest, NextResponse} from 'next/server';

import {successResponse, withAdminAuth, withAuth} from '@/utils/supabase/apiHelpers';

import {NewClub} from '@/types';

export async function GET(request: Request) {
  return withAuth(async (user, supabase) => {
    const {data, error} = await supabase
      .from('clubs')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching clubs:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return successResponse(data);
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(async (user, supabase, admin) => {
    const body: NewClub = await request.json();
    const {data, error} = await admin
      .from('clubs')
      .insert({
        ...body,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({data}, {status: 201});
  });
}
