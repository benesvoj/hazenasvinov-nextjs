import {NextRequest} from 'next/server';

import {errorResponse, successResponse, validateBody, withAuth} from '@/utils/supabase/apiHelpers';
import {hasCoachRole} from '@/utils/supabase/coachAuth';

import {createCoachCard, getCoachCardByUserId} from '@/queries/coachCards';

/**
 * GET /api/coach-cards
 *
 * Fetches the authenticated user's coach card.
 * Returns null data if no card exists (not an error).
 *
 * @returns { data: CoachCard | null, error: null }
 */
export async function GET() {
  return withAuth(async (user, supabase) => {
    const result = await getCoachCardByUserId({supabase}, user.id);

    // "No card found" is not an error - user just hasn't created one yet
    // Supabase returns this error when .single() finds 0 rows
    if (
      result.error?.includes('PGRST116') ||
      result.error?.includes('Cannot coerce the result to a single JSON object') ||
      result.error?.includes('JSON object requested, multiple (or no) rows returned')
    ) {
      return successResponse(null);
    }
    if (result.error) {
      console.error('[GET /api/coach-cards] Error:', result.error);
      return errorResponse(result.error, 500);
    }
    return successResponse(result.data);
  });
}

/**
 * POST /api/coach-cards
 *
 * Creates a new coach card for the authenticated user.
 *
 * Authorization:
 * - User must be authenticated
 * - User must have a coach role (coach, head_coach, assistant_coach)
 * - user_id in body must match authenticated user (enforced)
 * - User must not already have a coach card
 *
 * @body { name, surname, email?, phone?, note?, photo_url?, photo_path?, published_categories? }
 * @returns { data: CoachCard, error: null } with status 201
 */
export async function POST(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const isCoach = await hasCoachRole(supabase, user.id);
    if (!isCoach) {
      return errorResponse('Only coaches can create coach cards', 403);
    }
    const body = await request.json();

    const validation = validateBody(body, ['name', 'surname']);

    if (!validation.valid) {
      return errorResponse(`Missing required fields: ${validation.missing.join(', ')}`, 400);
    }

    // Check if user already has a coach card
    // If data exists, card already exists - block creation
    // If error is "no rows found" type, that's fine - no card exists yet
    const existingCard = await getCoachCardByUserId({supabase}, user.id);
    if (existingCard.data) {
      return errorResponse('You already have a coach card. Use PUT to update it.', 409);
    }

    const cardData = {
      ...body,
      user_id: user.id, // Always use authenticated user's ID
    };

    const result = await createCoachCard({supabase}, cardData);

    if (result.error) {
      console.error('[POST /api/coach-cards] Error:', result.error);
      return errorResponse(result.error, 500);
    }

    return successResponse(result.data, 201);
  });
}
