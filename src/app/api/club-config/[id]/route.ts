import {NextRequest} from 'next/server';

import {prepareUpdateData, successResponse, withAdminAuth} from '@/utils/supabase/apiHelpers';

import {ClubConfig} from '@/types';

export async function PATCH(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id} = await params;
    const body: ClubConfig = await request.json();
    const updateData = prepareUpdateData(body);

    const {data, error} = await admin
      .from('club_config')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return successResponse(data);
  });
}
