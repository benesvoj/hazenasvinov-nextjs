import {errorResponse, successResponse, withAdminAuth} from '@/utils/supabase/apiHelpers';

import {removeTeamFromTournament} from '@/queries/tournamentTeams';

export async function DELETE(
  request: Request,
  {params}: {params: Promise<{id: string; teamId: string}>}
) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id, teamId} = await params;

    if (!id || !teamId) {
      return errorResponse('Tournament ID and Team ID are required', 400);
    }

    const {data} = await removeTeamFromTournament({supabase: admin}, id, teamId);

    if (!data) {
      return errorResponse('Failed to remove team from tournament', 500);
    }

    return successResponse(data, 200);
  });
}
