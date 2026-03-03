import {NextRequest} from 'next/server';

import {MembersInternalQuerySchema} from '@/lib/validators/membersInternal';

import {errorResponse, successResponse, withAuth} from '@/utils/supabase/apiHelpers';

import {getMembersInternal} from '@/queries/membersInternal';

export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const parsed = MembersInternalQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    if (!parsed.success) {
      return errorResponse(JSON.stringify(parsed.error.flatten().fieldErrors), 400);
    }

    const result = await getMembersInternal(
      {supabase},
      {
        ...parsed.data,
        categoryId: parsed.data.category_id,
        // memberFunctions: parsed.data.function -> this is currently not supported, different structure TODO
      }
    );

    if (result.error) {
      return errorResponse(result.error, 500);
    }

    return successResponse({
      items: result.data,
      total: result.count,
    });
  });
}
