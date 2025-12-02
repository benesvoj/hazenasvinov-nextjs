import {NextRequest} from 'next/server';

import {successResponse, withAdminAuth, withAuth} from '@/utils/supabase/apiHelpers';

import {getAllMembers} from '@/queries/members';
import {MemberInsert} from '@/types';

/**
 * GET /api/members - List all members (already rexists via other routes, optional without any condition)
 * @param request
 * @constructor
 */
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const result = await getAllMembers(supabase);

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
