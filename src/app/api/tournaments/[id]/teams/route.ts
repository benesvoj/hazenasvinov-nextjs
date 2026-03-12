import {NextRequest} from 'next/server';

import {SupabaseClient} from '@supabase/supabase-js';

import {
  errorResponse,
  successResponse,
  withAdminAuth,
  withPublicAccess,
} from '@/utils/supabase/apiHelpers';

import {
  addTeamToTournament,
  getAllTournamentTeams,
  updateSeedOrders,
} from '@/queries/tournamentTeams';

export async function GET(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withPublicAccess(async (supabase: SupabaseClient) => {
    const {id} = await params;

    if (!id) {
      return errorResponse('Tournament is required', 400);
    }

    try {
      const {data, error} = await getAllTournamentTeams({supabase}, id);

      if (error) throw new Error(error);

      return successResponse(data);
    } catch (err: any) {
      return errorResponse(err.message);
    }
  });
}

export async function POST(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id} = await params;
    const body = await request.json();

    const {data, error} = await addTeamToTournament(
      {supabase: admin},
      id,
      body.team_id,
      body.seed_order
    );

    if (error) {
      return errorResponse(error, 400);
    }

    return successResponse(data);
  });
}

export async function PATCH(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id} = await params;
    const body = await request.json();

    const {data, error} = await updateSeedOrders({supabase: admin}, id, body.teams);

    if (error) {
      return errorResponse(error, 400);
    }

    return successResponse(data);
  });
}
