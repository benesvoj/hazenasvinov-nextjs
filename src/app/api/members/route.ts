import {NextRequest} from 'next/server';

import {successResponse, withAdminAuth, withAuth} from '@/utils/supabase/apiHelpers';

import {getMembersAll} from '@/queries/members';
import {MemberInsert} from '@/types';

/**
 * GET /api/members - List members.
 *
 * Returns only active members by default — deactivated (vyřazení) members must
 * not appear in selection lists. Pass `?includeInactive=true` to get everyone.
 */
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true';

    const result = await getMembersAll(
      {supabase},
      {
        limit: 1000,
        ...(includeInactive ? {} : {isActive: true}),
      }
    );

    if (result.error) {
      throw new Error(result.error);
    }

    return successResponse(result.data);
  });
}

/**
 *  POST /api/members - Create new member
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(async (user, supabase, admin) => {
    const body: MemberInsert = await request.json();
    const {data, error} = await admin
      .from('members')
      .insert({...body})
      .select()
      .single();

    if (error) throw error;

    return successResponse(data, 201);
  });
}
