import {NextRequest} from 'next/server';

import {successResponse, withAdminAuth} from '@/utils/supabase/apiHelpers';

import {getUserProfiles} from '@/queries/userProfiles';

export async function GET(request: NextRequest) {
  return withAdminAuth(async (_user, supabase) => {
    const userId = request.nextUrl.searchParams.get('userId') ?? undefined;
    const result = await getUserProfiles({supabase}, userId);
    return successResponse(result.data);
  });
}
