import {NextRequest} from 'next/server';

import {successResponse, withAdminAuth, withAuth} from '@/utils/supabase/apiHelpers';

import {CommitteeInsert} from '@/types';

export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const {data, error} = await supabase
      .from('committees')
      .select('*')
      .order('sort_order', {ascending: true});

    if (error) throw error;

    return successResponse(data);
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(async (user, supabase, admin) => {
    const body: CommitteeInsert = await request.json();
    const {data, error} = await admin
      .from('committees')
      .insert({...body})
      .select()
      .single();

    if (error) throw error;

    return successResponse(data, 201);
  });
}
