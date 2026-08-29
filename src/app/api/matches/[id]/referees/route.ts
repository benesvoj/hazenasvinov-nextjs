import {NextRequest} from 'next/server';

import {successResponse, withAdminAuth, withAuth} from '@/utils/supabase/apiHelpers';

export async function GET(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAuth(async (user, supabase) => {
    const {id: matchId} = await params;

    const {data, error} = await supabase
      .from('match_referees')
      .select('match_id, referee_id, order, referee:referees(*)')
      .eq('match_id', matchId)
      .order('order');

    if (error) throw error;

    return successResponse(data);
  });
}

export async function PUT(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id: matchId} = await params;
    const body: {referee_id_1?: string | null; referee_id_2?: string | null} = await request.json();

    const {error: deleteError} = await admin
      .from('match_referees')
      .delete()
      .eq('match_id', matchId);

    if (deleteError) throw deleteError;

    const rows = [];
    if (body.referee_id_1) {
      rows.push({match_id: matchId, referee_id: body.referee_id_1, order: 1});
    }
    if (body.referee_id_2) {
      rows.push({match_id: matchId, referee_id: body.referee_id_2, order: 2});
    }

    if (rows.length > 0) {
      const {error: insertError} = await admin.from('match_referees').insert(rows);
      if (insertError) throw insertError;
    }

    return successResponse({success: true});
  });
}
