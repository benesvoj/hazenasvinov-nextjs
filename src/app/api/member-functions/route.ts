import {NextRequest, NextResponse} from 'next/server';

import {successResponse, withAdminAuth, withAuth} from '@/utils/supabase/apiHelpers';

import {CreateMemberFunction} from '@/types';

export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const {data, error} = await supabase
      .from('member_functions')
      .select('*')
      .order('sort_order', {ascending: true})
      .order('display_name', {ascending: true});

    if (error) {
      console.error('Error fetching member functions', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return successResponse(data);
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(async (user, supabase, admin) => {
    const body: CreateMemberFunction = await request.json();
    const {data, error} = await admin
      .from('member_functions')
      .insert({...body})
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({data}, {status: 201});
  });
}
