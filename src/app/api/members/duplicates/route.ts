import {NextRequest} from 'next/server';

import {errorResponse, successResponse, withAuth} from '@/utils/supabase/apiHelpers';

import {getMemberDuplicates} from '@/queries/members';

/**
 * GET /api/members/duplicates?name=Jan&surname=Novák&excludeId=uuid
 *
 * Returns members sharing the given name across all categories, so the member
 * form can warn about a possible duplicate. Purely informational — namesakes
 * are allowed, and this endpoint never blocks a write.
 */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name')?.trim() ?? '';
  const surname = request.nextUrl.searchParams.get('surname')?.trim() ?? '';
  const excludeId = request.nextUrl.searchParams.get('excludeId') ?? undefined;

  if (!name || !surname) {
    return errorResponse('Parametry name a surname jsou povinné', 400);
  }

  return withAuth(async (user, supabase) => {
    const result = await getMemberDuplicates({supabase}, {name, surname, excludeId});

    if (result.error) {
      return errorResponse(result.error, 500);
    }

    return successResponse(result.data);
  });
}
