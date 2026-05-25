import {NextRequest} from 'next/server';

import {errorResponse, successResponse, withAdminAuth} from '@/utils/supabase/apiHelpers';

export async function DELETE(_request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAdminAuth(async (_user, _supabase, admin) => {
    const {id} = await params;

    const {error} = await admin.from('point_deductions').delete().eq('id', id);

    if (error) throw error;

    return successResponse({success: true});
  });
}

export async function PATCH(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAdminAuth(async (_user, _supabase, admin) => {
    const {id} = await params;
    const body = await request.json();

    const {data, error} = await admin
      .from('point_deductions')
      .update(body)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    if (!data) return errorResponse('Not found', 404);

    return successResponse(data);
  });
}
