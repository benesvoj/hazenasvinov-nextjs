import {NextRequest, NextResponse} from 'next/server';

import {
  errorResponse,
  prepareUpdateData,
  successResponse,
  withAdminAuth,
  withAuth,
} from '@/utils/supabase/apiHelpers';

import {UpdateClub} from '@/types';

export async function GET(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAuth(async (user, supabase) => {
    const {id} = await params;
    const {data, error} = await supabase.from('clubs').select('*').eq('id', id).single();

    if (error) throw error;

    if (!data) {
      return errorResponse('Club not found', 404);
    }

    return successResponse(data);
  });
}

export async function PATCH(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id} = await params;
    const body: UpdateClub = await request.json();
    const updateData = prepareUpdateData(body);

    const {data, error} = await admin
      .from('clubs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return successResponse(data);
  });
}

export async function DELETE(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id} = await params;

    const {data: existing} = await admin.from('clubs').select('id').eq('id', id).single();

    if (!existing) {
      return errorResponse('Club not found', 404);
    }

    const {error} = await admin.from('clubs').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({success: true, error: null});
  });
}
