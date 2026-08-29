import {NextRequest} from 'next/server';

import {successResponse, withAdminAuth, withAuth} from '@/utils/supabase/apiHelpers';

import {RefereeInsert} from '@/types';

export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const {searchParams} = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    let query = supabase.from('referees').select('*').order('surname').order('name');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const {data, error} = await query;

    if (error) throw error;

    return successResponse(data);
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(async (user, supabase, admin) => {
    const body: RefereeInsert = await request.json();

    const {data, error} = await admin.from('referees').insert(body).select().single();

    if (error) throw error;

    return successResponse(data, 201);
  });
}
