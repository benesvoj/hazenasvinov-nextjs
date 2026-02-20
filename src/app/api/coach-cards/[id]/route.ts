import {NextRequest} from 'next/server';

import {
  errorResponse,
  prepareUpdateData,
  successResponse,
  withAuth,
} from '@/utils/supabase/apiHelpers';
import {checkCoachCardAccess} from '@/utils/supabase/coachAuth';

import {deleteCoachCard, getCoachCardById, updateCoachCard} from '@/queries/coachCards';

type RouteParams = {params: Promise<{id: string}>};

/**
 * GET /api/coach-cards/[id]
 *
 * Fetches a specific coach card by ID.
 *
 * Authorization:
 * - Owner can read their own card
 * - Admin can read any card
 *
 * @returns { data: CoachCard, error: null }
 */
export async function GET(request: NextRequest, {params}: RouteParams) {
  const {id} = await params;

  return withAuth(async (user, supabase) => {
    // Check access
    const access = await checkCoachCardAccess(supabase, id, user.id, 'read');
    if (!access.allowed) {
      return errorResponse(access.reason || 'Access denied', 403);
    }

    // Fetch the card
    const result = await getCoachCardById({supabase}, id);

    if (result.error) {
      console.error(`[GET /api/coach-cards/${id}] Error:`, result.error);
      return errorResponse(result.error, 500);
    }

    if (!result.data) {
      return errorResponse('Coach card not found', 404);
    }

    return successResponse(result.data);
  });
}

/**
 * PUT /api/coach-cards/[id]
 *
 * Updates a coach card.
 *
 * Authorization:
 * - Only the owner can update their card
 * - Admins CANNOT update (respect coach's personal data)
 *
 * @body Partial<CoachCard> fields to update
 * @returns { data: CoachCard, error: null }
 */
export async function PUT(request: NextRequest, {params}: RouteParams) {
  const {id} = await params;

  return withAuth(async (user, supabase) => {
    // Check access - only owner can write
    const access = await checkCoachCardAccess(supabase, id, user.id, 'write');
    if (!access.allowed) {
      return errorResponse(access.reason || 'Access denied', 403);
    }

    // Parse request body
    const body = await request.json();

    // Prepare update data (excludes id, adds updated_at)
    // Also exclude user_id to prevent ownership transfer
    const updateData = prepareUpdateData(body, ['id', 'user_id', 'created_at']);

    // Update the card
    const result = await updateCoachCard({supabase}, id, updateData);

    if (result.error) {
      console.error(`[PUT /api/coach-cards/${id}] Error:`, result.error);
      return errorResponse(result.error, 500);
    }

    return successResponse(result.data);
  });
}

/**
 * DELETE /api/coach-cards/[id]
 *
 * Deletes a coach card.
 *
 * Authorization:
 * - Owner can delete their own card
 * - Admin can delete any card
 *
 * @returns { data: { success: true }, error: null }
 */
export async function DELETE(request: NextRequest, {params}: RouteParams) {
  const {id} = await params;

  return withAuth(async (user, supabase) => {
    // Check access
    const access = await checkCoachCardAccess(supabase, id, user.id, 'delete');
    if (!access.allowed) {
      return errorResponse(access.reason || 'Access denied', 403);
    }

    // Delete the card
    const result = await deleteCoachCard({supabase}, id);

    if (result.error) {
      console.error(`[DELETE /api/coach-cards/${id}] Error:`, result.error);
      return errorResponse(result.error, 500);
    }

    return successResponse({success: true});
  });
}
